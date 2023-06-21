//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dbname = "todolistDB";
const uri = `mongodb+srv://jhadeepesh3:nVb2hIdBBVuMd5Li@deepesh.jzjdlwj.mongodb.net/${dbname}?retryWrites=true&w=majority`;


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(uri);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
    console.log("Connected successfully");
});

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item.>"
});

const defaultItems = [item1, item2, item3];

const listsSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listsSchema);


app.get("/", function (req, res) {
    Item.find({}).then(items => {
        if (items.length === 0) {
            Item.insertMany(defaultItems).then(() => {
                console.log("Inserted successfully");
            });
            res.redirect("/");
        }
        else
            res.render("list", { listTitle: "Today", newListItems: items });
    });


});

app.get("/lists/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }).then(list => {
        // console.log(list);
        if (!list) {
            const newList = new List({
                name: customListName,
                items: defaultItems
            });
            newList.save();
            res.redirect("/" + customListName);
        }
        else {
            res.render("list", { listTitle: customListName, newListItems: list.items });
        }
    });

});

app.get("/about", function (req, res) {
    res.render("about");
});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect("/");
    }
    else {
        List.findOne({name: listName}).then(foundList => {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/lists/" + listName);
        });
    }

});

app.post("/delete", (req, res) => {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.deleteOne({ _id: checkedItemID }).then(() => {
            console.log("Successfully deleted");
        });
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}).then(foundList => {
            res.redirect("/lists/" + listName);
        });
    }
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});
