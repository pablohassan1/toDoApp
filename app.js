// require NPM modules
require("dotenv").config();
const express = require("express");
const app = express();
const lodash = require("lodash");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const atlasPass = process.env.ATLAS_PASS;
//

// initialize NPM modules
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.use(express.static("public"));
mongoose.set('useFindAndModify', false);
//


// connect to MongoDB Atlas
mongoose.connect("mongodb+srv://admin-jan:" + atlasPass + "@cluster0.njvgj.mongodb.net/toDoApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//

// create schema in the DB (itemsSchema)
const itemsSchema = {
  name: String
};
//

// create model within itemsSchema (Item)
const Item = mongoose.model("Item", itemsSchema);
//

// create default items to display initially (Item model)
const item1 = new Item({
  name: "Welcome to your To Do List!"
});
const item2 = new Item({
  name: "Hit + button  to add a new item."
});
const item3 = new Item({
  name: "< -- Hit this to remove the item."
});
const defaultItems = [item1, item2, item3];
//

// create DB schema (listSchema)
const listSchema = {
  name: String,
  items: [itemsSchema]
};
//

// create model within listsSchema (List)
const List = mongoose.model("List", listSchema);
//

// create initial items (in case these don't exist yet) and render list.ejs.
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (!err) {
          console.log("Default items added to toDoList03 DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        listItems: foundItems
      });
    }
  });
});
//

// create new lists in the listSchema (in case they don't exist) and render list.ejs
app.get("/:customListName", function(req, res) {
  const customListName = lodash.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          listItems: foundList.items
        });
      }
    }
  });
});
//

// create new items in the itemsSchema or listSchema depending on the post request parameters
app.post("/", function(req, res) {
  const listName = req.body.button;
  const itemName = req.body.newItem;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
//

// delete items from both the itemsSchema and listSchema depending on the post request parameters
app.post("/delete", function(req, res) {
  const deleteItemId = req.body.checkbox;
  const listName = req.body.list;
  if (listName === "Today") {
    Item.findByIdAndRemove(deleteItemId, function(err) {
      if (!err) {
        console.log("Item ID: " + deleteItemId + " deleted.;");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: deleteItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully!");
});
