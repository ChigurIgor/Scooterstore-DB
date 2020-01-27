const express = require("express");
const bodyParser= require("body-parser");
var qs = require('querystring');
var mongo = require('mongodb');
const pdfMakePrinter = require('pdfmake/src/printer');
var path = require('path');
var Printer = require('pdfmake');
var wait = require('wait.for');


const PORT = process.env.PORT || 5000;

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://madcat:masterminde+1@ds117070.mlab.com:17070/scooterstore";
const mongoClient = new MongoClient(url, { useNewUrlParser: true });
// создаем объект MongoClient и передаем ему строку подключения
const dbName="scooterstore";

// let timeCicle=0;
// let timeout=60000;

// setInterval(function() {
//     console.log('setInterval');
//     timeCicle++;
//     console.log(timeCicle);
//
//     var timeInMs = Date.now();
//     console.log(timeInMs);
//
//     searchReserve(timeInMs);
//
// }, timeout);

var app=express();

var cors = require('cors');

app.use(cors());


app.get('/',(req,res)=>res.send("Hi"));


app.listen(process.env.PORT || 5000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

// app.use(express.bodyParser());
app.use(bodyParser.json());



// // -------------------------------------------------------- items --------------------------------------------------------------------------

app.get('/getitems',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    getItems(res);
});

function getItems(res){
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            try {
                await db.collection("items").find().toArray(function (err, documents) {
                    // console.log(documents);
                    res.end(JSON.stringify(documents));
                });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");
            }
        }
    });
}


app.post('/getitem',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    console.log('getitem');
    let data ={};
    var post = req.body;
    data.id = post.id;
    data.res = res;

    const promise = new Promise((resolve, reject) => getItem(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))});

});

function getItem(data, resolve, reject){
    console.log('getItem');
    let id = data.id;
    let res = data.res;
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            try {
                let o_id = new mongo.ObjectID(id);
                await db.collection("items").find({ "_id" : o_id }).toArray(function (err, documents) {
                    if (documents.length == 0) {
                        resolve({msg: "Error occurred"});
                    } else {
                        resolve({item: documents[0], res: res});
                    }
                });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");
            }
        }
    });
}


app.post('/item_add',(req,res)=>{
    console.log("We are in registration");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");
    // let description="";
    // let imgs=[];
    // let material="";
    // let name="";
    // let price;
    // let type="";
    // let cat="";
    var post = req.body;
    let data ={};
    data.description=post.item.description;
    data.imgs=post.item.imgs;
    data.material=post.item.material;
    data.name=post.item.name;
    data.price=post.item.price;
    data.type=post.item.type;
    data.cat=post.item.cat;
    data.res = res;

    const promise = new Promise((resolve, reject) => itemAdd(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))});

});

function itemAdd(data, resolve, reject) {
    console.log('itemAdd');
    let res = data.res;
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        const collection = db.collection("items");
        let cart = [];
        let orders = [];
        let item = {
            description: data.description,
            imgs:data.imgs,
            material:data.material,
            name:data.name,
            price:data.price,
            type:data.type,
            cat: data.cat,
            };
        console.log(item);
        try {
            await collection.insertOne(item, function (err, result) {
                if (err) throw err;
                console.log('itemAdded');
                resolve({ msg: "OK" ,res: res});
            });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }
    });
}


app.post('/item_delete',(req,res)=>{
    console.log("We are in item_delete");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");

    var post = req.body;
    let data ={};
    console.log(req.body);
    data.id = post.id;
    data.res = res;
    console.log(data);

    const promise = new Promise((resolve, reject) => itemDelete(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))});

});

function itemDelete(data, resolve, reject) {
    console.log('itemDelete');
    let res = data.res;
    let id = data.id;
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        var answer = "0";
        // var allProductsArray = db.collection("items").find().toArray();
        try {

            let o_id = new mongo.ObjectID(id);
            await db.collection("items")
                .deleteOne({"_id" : o_id  }, function(err, documents) {
                        if (err) throw err;
                        resolve({ msg: "OK" ,res: res});
                    });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }

    });
}

app.post('/item_set',(req,res)=>{
    console.log("We are in item_delete");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");

    var post = req.body;
    let data ={};
    data.description=post.item.description;
    data.imgs=post.item.imgs;
    data.material=post.item.material;
    data.name=post.item.name;
    data.price=post.item.price;
    data.type=post.item.type;
    data.cat=post.item.cat;
    data.id = post.id;
    console.log(data);
    data.res = res;

    const promise = new Promise((resolve, reject) => itemSet(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))});

});

function itemSet(data, resolve, reject) {
    console.log('itemSet');
    let res = data.res;
    let id = data.id;
    let description = data.description;
    let imgs = data.imgs;
    let material = data.material;
    let name = data.name;
    let price = data.price;
    let type = data.type;
    let cat = data.cat;
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        var answer = "0";
        // var allProductsArray = db.collection("items").find().toArray();
        try {
            let o_id = new mongo.ObjectID(id);
            await db.collection("items")
                .updateOne({"_id" : o_id },
                    { $set:
                            {
                                name: name,
                                description: description,
                                imgs: imgs,
                                material: material,
                                price: price,
                                type: type,
                                cat: cat
                            } }, function(err, documents) {
                        if (err) throw err;
                        resolve({ msg: "OK" ,res: res});
                    });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }
    });
}

// // -------------------------------------------------------- items --------------------------------------------------------------------------
//
//
//
// -------------------------------------------------------- users --------------------------------------------------------------------------


app.post('/registration',(req,res)=>{
    console.log("We are in registration");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");
    let name="";
    let surname="";
    let street="";
    let house="";
    let postcode="";
    let city="";
    let country="";
    let email="";
    let password="";
    let phone="";
    let getnewsagree;


    var post = req.body;
    let data ={};
    data.name=post.name;
    data.surname=post.surname;
    data.street=post.street;
    data.house=post.house;
    data.postcode=post.postcode;
    data.city=post.city;
    data.country=post.country;
    data.email=post.email;
    data.password=post.password;
    data.phone=post.phone;
    data.getnewsagree = post.getnewsagree;

    data.res = res;


    const promise = new Promise((resolve, reject) => userAdd(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))});



});

function userAdd(data, resolve, reject) {
    console.log('userAdd');

    let res = data.res;
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);

        const collection = db.collection("users");
        let cart = [];
        let orders = [];
        let user = {
            name: data.name,
            surname:data.surname,
            street:data.street,
            house:data.house,
            postcode:data.postcode,
            city:data.city,
            cart: data.cart,
            orders: data.orders,
            country:data.country,
            email:data.email,
            password:data.password,
            phone:data.phone,
            getnewsagree: data.getnewsagree
        };
        console.log(user);
       try {
    await collection.insertOne(user, function (err, result) {

                if (err) throw err;
                console.log('userAdded');
                    delete user.password;
                resolve({ user: user ,res: res});

            });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }
    });
}

app.post('/login',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let login="";
    let password="";

    let body = '';

    var post = req.body;
    console.log(post);
    // req.on('data', chunk => {
    //     console.log("req.on");
    //     body += chunk.toString(); // convert Buffer to string
    // });
    // req.on('end', () => {
    //     console.log("req.end");

        // var post = qs.parse(body);

        // console.log(body);
        login=post.login;
        password=post.password;

        loginFun(login,password,res);
    // });

});

function loginFun(login,password,res){

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {

                console.log(login);
                console.log(password);
                await db.collection("users").find({email: login,password: password}).toArray(function (err, documents) {
                    console.log(documents);
                    if ( documents.length > 0){
                        delete documents[0].password;
                    }
                    res.end(JSON.stringify(documents[0]));


                });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");

            }
        }

    });
}

function getUserById(data, resolve, reject){
    let uid = data.uid;
    if(uid == "0" || uid == null || uid || undefined){
        data.msg = "ERROR";
        resolve(data);
    }
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {
                let o_id = new mongo.ObjectID(uid);
                await db.collection("users").findOne({"_id" : o_id },function (err, documents) {
                      console.log('getUserById');
                        console.log(documents);
                        delete documents.password;
                        data.user = documents;
                        resolve(data);
               });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");
            }
        }
    });
}

app.post('/user_get',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let data ={};
    data.uid="";
    let body = '';

    var post = req.body;
    console.log('user_get');
    data.uid = post.uid;
    data.res = res;
    console.log(data);

    const promise = new Promise((resolve, reject) => getUserById(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})

});

// function getUser(data) {
//     console.log('getUser');
//     let uid = data.uid;
//     let res = data.res;
//     //  todo  --     rewrite
//
//     var mongoClientPromise = mongoClient.connect(async function (err, client) {
//         if (err){
//             console.error('An error occurred connecting to MongoDB: ',err);
//         }else {
//             const db = client.db(dbName);
//             try {
//                 let o_id = new mongo.ObjectID(uid);
//                 await db.collection("users").find({ "_id" : o_id }).toArray(function (err, documents) {
//                     console.log(documents);
//                     if (documents.length == 0) {
//                         res.end(JSON.stringify({msg: "Error occurred"}));
//                     } else {
//                     delete documents[0].password;
//                     res.end(JSON.stringify(documents[0]));
//                 }
//                 });
//             } finally {
//                 if (mongoClientPromise) mongoClientPromise.close();
//                 console.log("client.close()");
//             }
//         }
//     });
// }


app.post('/user_set',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    console.log('user_set');
    let data ={};
    let body = '';

    var post = req.body;
    data.user = post.user;
    console.log('data.user');
    console.log(data.user);
    data.res = res;

    const promise = new Promise((resolve, reject) => setUser(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})

});

function setUser(data, resolve, reject) {
    console.log('setUser');
    let res = data.res;

    let uid = data.user._id;
    let name = data.user.name;
    let surname = data.user.surname;
    let postcode = data.user.postcode;
    let email = data.user.email;
    let country = data.user.country;
    let street = data.user.street;
    let house = data.user.house;
    let city = data.user.city;
    let phone = data.user.phone;
    let getnewsagree = data.user.getnewsagree;

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        var answer = "0";
        // var allProductsArray = db.collection("items").find().toArray();
        try {

            let o_id = new mongo.ObjectID(uid);
            await db.collection("users")
                    .updateOne({"_id" : o_id },
                        { $set:
                                {
                                    name: name,
                                    surname: surname,
                                    postcode: postcode,
                                    email: email,
                                    country: country,
                                    street: street,
                                    house: house,
                                    city: city,
                                    phone: phone,
                                    getnewsagree: getnewsagree
                                    } }, function(err, documents) {
                if (err) throw err;
                resolve({ msg: "OK" ,res: res});
            });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }

    });
}


// -------------------------------------------------------- users --------------------------------------------------------------------------

// -------------------------------------------------------- orders --------------------------------------------------------------------------



app.post('/order_add',(req,res)=>{
    console.log("We are in orderadd");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");

    let data ={};
    data.uid="";
    data.items=[];
    data.sum="";
    data.paymentID="";
    data.paymentCart="";
    data.paymentTime="";
    data.paymentEmail="";
    data.paymentPayerId="";
    data.paymentPayerAddress="";


    let body = '';
    // console.log(req);
    // console.log(req.toString());
    // console.log("req.data.body");
    // console.log(req.body);

    // req.on('data', chunk => {
    //     body += chunk.toString(); // convert Buffer to string
    //     console.log(body);
    //     console.log(chunk);
    // });
    // body= req.body;
    // req.on('end', () => {
    var post = req.body;
    // var post = qs.parse(body);
    //     console.log("req.end");
    //
    //     console.log(body);

    data.uid=post.uid[0];
    data.items=post.items;
    data.sum=post.sum;
    data.paymentID=post.paymentID;
    data.paymentCart=post.paymentCart;
    data.paymentTime=post.paymentTime;
    data.paymentEmail=post.paymentEmail;
    data.paymentPayerId=post.paymentPayerId;
    data.paymentPayerAddress=post.paymentPayerAddress;
    data.res = res;

// console.log(data);

const promise = new Promise((resolve, reject) => orderAdd(data, resolve, reject))
                    .then((data)=> { return new Promise((resolve, reject) => getUserById(data, resolve, reject))})
                    .then((data)=> { return new Promise((resolve, reject) => orderAddToAccount(data, resolve, reject))})
                    .then((data)=> { return new Promise((resolve, reject) => setCart(data, resolve, reject))})
                    .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
});

app.post('/orders_get_from_user',(req,res)=>{
    console.log("We are in orders_get_from_user");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");

    let data ={};
    data.uid="";
    let body = '';

    var post = req.body;

    data.uid = post.uid;
    console.log(data);
    data.res = res;

    const promise = new Promise((resolve, reject) => getUserById(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => ordersGetFromAccount(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => ordersGetByList(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
    });

app.post('/orders_get',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    let data = {};
    data.res = res;

    const promise = new Promise((resolve, reject) => getOrders(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
});

app.post('/orders_get_list',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let data ={};
    data.res = res;
    const promise = new Promise((resolve, reject) => getOrders(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => ordersListMap(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
});

app.post('/order_get_by_id',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let data ={};
    var post = req.body;
    console.log('order_get_list');
    data.id = post.id;
    data.res = res;
    const promise = new Promise((resolve, reject) => getOrderById(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
});

function getOrders(data, resolve, reject){

    console.log('getOrders');
    let res = data.res;

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            try {
                await db.collection("orders").find().toArray(function (err, documents) {
                    console.log(documents);
                    data.orders = documents;
                    data.res = res;
                    resolve(data);
                });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");
            }
        }
    });
}

function getOrderById(data, resolve, reject){
    console.log('getOrdersById');
    let res = data.res;
    let id = data.id;
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            try {

                let o_id = new mongo.ObjectID(id);
                await db.collection("orders").findOne({"_id" : o_id }, function(err, documents) {
                    if (err) throw err;
                    console.log(documents);
                    data.order = documents;
                    data.res = res;
                    resolve(data);
                });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");
            }
        }
    });
}


function ordersListMap(data, resolve, reject){
    let orders = data.orders;
    let res = data.res;
    let itemsMaped = [];
    for( let order of orders){
        let itemTemp = {};
        itemTemp._id = order._id;
        itemTemp.sum = order.sum;
        itemTemp.paymentTime = order.paymentTime;
        itemsMaped.push(itemTemp);
    }
    data.orders = itemsMaped;
    data.res = res;
    resolve(data);
}

// app.post('/order_get_by_id',(req,res)=>{
//     console.log("We are in orderadd");
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.header('Access-Control-Allow-Headers', "*");
//
//     let data ={};
//     data.uid="";
//     data.items=[];
//     data.sum="";
//     data.paymentID="";
//     data.paymentCart="";
//     data.paymentTime="";
//     data.paymentEmail="";
//     data.paymentPayerId="";
//     data.paymentPayerAddress="";
//
//
//     let body = '';
//     // console.log(req);
//     // console.log(req.toString());
//     // console.log("req.data.body");
//     // console.log(req.body);
//
//     // req.on('data', chunk => {
//     //     body += chunk.toString(); // convert Buffer to string
//     //     console.log(body);
//     //     console.log(chunk);
//     // });
//     // body= req.body;
//     // req.on('end', () => {
//     var post = req.body;
//     // var post = qs.parse(body);
//     //     console.log("req.end");
//     //
//     //     console.log(body);
//
//     data.uid=post.uid[0];
//     data.items=post.items;
//     data.sum=post.sum;
//     data.paymentID=post.paymentID;
//     data.paymentCart=post.paymentCart;
//     data.paymentTime=post.paymentTime;
//     data.paymentEmail=post.paymentEmail;
//     data.paymentPayerId=post.paymentPayerId;
//     data.paymentPayerAddress=post.paymentPayerAddress;
//
//     console.log(data);
//
//     const promise = new Promise((resolve, reject) => orderAdd(data, res, resolve, reject))
//         .then((data)=> { return new Promise((resolve, reject) => getUserById(data, resolve, reject))})
//         .then((data)=> { return new Promise((resolve, reject) => orderAddToAccount(data, resolve, reject))})
//         .then((data)=> { return new Promise((resolve, reject) => setCart(data, resolve, reject))})
//         .then((data)=> { return new Promise((resolve, reject) => okFunction(data, resolve, reject))})
// });

function orderAdd(data, resolve, reject){
// function orderAdd(uid, items,sum,paymentID,paymentCart,paymentTime,paymentEmail,paymentPayerId,paymentPayerAddress, res){
    console.log('orderAdd');
    let res = data.res;

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        const collection = db.collection("orders");
        let order = {
            uid:data.uid,
            paymentID:data.paymentID,
            paymentCart:data.paymentCart,
            paymentTime:data.paymentTime,
            paymentEmail:data.paymentEmail,
            paymentPayerId:data.paymentPayerId,
            paymentPayerAddress:data.paymentPayerAddress,
            sum:data.sum,
            items:data.items,
            };
        try {
            await collection.insertOne(order, function (err, result) {
                if (err) {
                    return console.log(err);
                    //todo -- add reject
                }
                resolve({orderId: result.ops[0]._id, uid: data.uid,res: res});
                // resolve({ msg: "OK" , orderId: result.ops[0]._id, uid: data.uid}, res);
            });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }
    });
}

function orderAddToAccount(data, resolve, reject){
    console.log('orderAddToAccount');
    let orderId = data.orderId;
    let uid = data.uid;
    let res = data.res;
    let user = data.user;
    let orders = user.orders;
    orders.push(orderId);
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        var answer = "0";
        // var allProductsArray = db.collection("items").find().toArray();
        try {
            let o_id = new mongo.ObjectID(uid);
                await db.collection("users").updateOne({"_id" : o_id }, { $set: {orders: orders } }, function(err, documents) {
                    if (err) throw err;
                    data.cart = [];
                    resolve(data);
                });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }
    });

}




//   function orderGetById(id){
// console.log('orderGetById');
//     var mongoClientPromise = mongoClient.connect(async function (err, client) {
//         if (err){
//             console.error('An error occurred connecting to MongoDB: ',err);
//         }else {
//             const db = client.db(dbName);
//             var answer = "0";
//             // var allProductsArray = db.collection("phones").find().toArray();
//             try {
//                 let o_id = new mongo.ObjectID(id);
//                 await db.collection("orders").find({ "_id" : o_id }).toArray(function (err, documents) {
//                     console.log(documents[0]);
//                         return documents[0];
//                 });
//             } finally {
//                 if (mongoClientPromise) mongoClientPromise.close();
//                 console.log("client.close()");
//
//             }
//         }
//
//     });
// }
  function ordersGetFromAccount(data, resolve, reject){
    let data2 = {};
    data2.orders = data.user.orders || [];
    data2.res = data.res;
    resolve(data2);
}


function ordersGetByList(data, resolve, reject){
    let orders = [];
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
                try {
                await db.collection("orders").find().toArray(function (err, documents) {
                    orders = documents;
                    let ordersMaped = [];
                    for(let orderId of data.orders){
                             let orderObj = orders.find(x => x._id.equals(orderId));
                        console.log(orderObj);
                        ordersMaped.push(orderObj);
                    }
                    console.log(ordersMaped);
                    resolve({orders:ordersMaped, res: data.res});
                });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");
            }
    });
}

// // -------------------------------------------------------- orders --------------------------------------------------------------------------


// // -------------------------------------------------------- cart --------------------------------------------------------------------------
app.post('/cart_set',(req,res)=>{
    console.log("We are in cart_set");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");

    let data ={};
    data.uid="";
    let body = '';

    var post = req.body;

    data.uid = post.uid[0];
    data.cart = post.cart;
    data.res = res;
    console.log(data);

    const promise = new Promise((resolve, reject) => setCart(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
});

app.post('/cart_add',(req,res)=>{
    console.log("We are in orders_get_from_user");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");

    let data ={};
    let body = '';

    var post = req.body;

    data.uid = post.uid[0];
    data.item = post.item;
    data.quantity = post.quantity;
    data.res = res;
    console.log(data);

    const promise = new Promise((resolve, reject) => getUserById(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => cartGetFromAccount(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => cartAddItem(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => setCart(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
});

app.post('/cart_get_from_user',(req,res)=>{
    console.log("We are in orders_get_from_user");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");

    let data ={};
    data.uid="";
    let body = '';

    var post = req.body;

    data.uid = post.uid[0];
    data.res = res;
    console.log(data);

    const promise = new Promise((resolve, reject) => getUserById(data, resolve, reject))
        .then((data)=> { return new Promise((resolve, reject) => cartGetFromAccount(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => cartItemsGetByList(data, resolve, reject))})
        .then((data)=> { return new Promise((resolve, reject) => sendAnswer(data, resolve, reject))})
});

function setCart(data, resolve, reject){
    console.log('setCart');
    let uid = data.uid;
    let res = data.res;
    let cart = data.cart;

    console.log(cart);
    console.log(uid);




    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        var answer = "0";
        // var allProductsArray = db.collection("items").find().toArray();
        try {

            let o_id = new mongo.ObjectID(uid);
            await db.collection("users").updateOne({"_id" : o_id }, { $set: {cart: cart } }, function(err, documents) {
                if (err) throw err;
                resolve({ msg: "OK" ,res: res});
            });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }


    });

}

function cartGetFromAccount(data, resolve, reject){
    let data2 = {};
    data2.cart = data.user.cart || [];
    data2.uid = data.uid;
    data2.item = data.item;
    data2.items = data.items;
    data2.quantity = data.quantity;
    data2.res = data.res;
    resolve(data2);
}

function cartAddItem(data, resolve, reject){

    let cart = data.cart;
    let item = data.item;
    let quantity = parseInt(data.quantity);
    console.log('cartAddItem');
    console.log('item');
    console.log(item);
    console.log('cart');
    console.log(cart);
    console.log('uid');
    console.log(data.uid);
        for(let cartItem of cart){
            console.log(cartItem);
            console.log(cartItem.id);
            console.log(item._id);
            if((cartItem.id.valueOf()) == (item._id.valueOf())){
                cartItem.quantity = cartItem.quantity +quantity;
            }
        }
        if(!cart.find(x => (x.id).valueOf() == (item._id).valueOf())){
            let obj = {id: item._id, quantity: quantity};
            cart.push(obj);
        }
    console.log('cart after manipulations');
    console.log(cart);
    data.cart = cart;
    resolve(data);
}

function cartItemsGetByList(data, resolve, reject){
    let items = [];
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        try {
            await db.collection("items").find().toArray(function (err, documents) {
                items = documents;
                console.log('cartItemsGetByList');
                let itemsMaped = [];
                for(let item of data.cart){
                    let itemObj = items.find(x => x._id.valueOf() == (item.id).valueOf());
                    itemObj.quantity = item.quantity;
                    itemsMaped.push(itemObj);
                }
                console.log(itemsMaped);
                resolve({cart:itemsMaped, res: data.res});
            });
        } finally {
            if (mongoClientPromise) mongoClientPromise.close();
            console.log("client.close()");
        }
    });
}


// // -------------------------------------------------------- cart --------------------------------------------------------------------------




// // -------------------------------------------------------- news --------------------------------------------------------------------------

app.post('/news_get',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    console.log('req');
    console.log(req);
    getNews(res);
});

function getNews(res){
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            try {
                await db.collection("news").find().toArray(function (err, documents) {
                    // console.log(documents);
                    res.end(JSON.stringify(documents));
                });
            } finally {
                if (mongoClientPromise) mongoClientPromise.close();
                console.log("client.close()");
            }
        }
    });
}





// // -------------------------------------------------------- news --------------------------------------------------------------------------









// // -------------------------------------------------------- reserve ------------------------------------------------------------------------
//
// app.post('/reserveadd',(req,res)=>{
//     console.log("We are in reserveadd");
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.header('Access-Control-Allow-Headers', "*");
//     let eventId="";
//     let uid="";
//     let places=[];
//
//     let body = '';
//     // console.log(req);
//     // console.log(req.toString());
//     // console.log("req.data.body");
//     // console.log(req.body);
//
//     // req.on('data', chunk => {
//     //     body += chunk.toString(); // convert Buffer to string
//     //     console.log(body);
//     //     console.log(chunk);
//     // });
//     // body= req.body;
//     // req.on('end', () => {
//     var post = req.body;
//     // var post = qs.parse(body);
//     //     console.log("req.end");
//     //
//     //     console.log(body);
//     eventId=post.id;
//     uid=post.uid;
//     places=post.places;
//
//
//     reserveAdd(eventId, uid, places, res);
//     // res.end(JSON.stringify({ msg: "OK" }));
//     // });
// // console.log(req.body.gender);
//
// });
//
// function reserveAdd(eventId, uid, places, res) {
//
//     console.log("We are in func orderadd");
//
//
//     var mongoClientPromise = mongoClient.connect(async function (err, client) {
//         if (err){
//             console.error('An error occurred connecting to MongoDB: ',err);
//         }else {
//             const db = client.db(dbName);
//             var answer = "0";
//             // var allProductsArray = db.collection("phones").find().toArray();
//             try {
//                 let o_id = new mongo.ObjectID(eventId);
//                 console.log('o_id');
//                 console.log(o_id);
//
//                 await db.collection("events").find({ "_id" : o_id }).toArray(function (err, documents) {
//                     // console.log(documents);
//
//                     // res.end(JSON.stringify(documents));
//                     reserveSetSeats(documents, places, res, uid, o_id);
//
//                 });
//             } finally {
//                 if (db) mongoClientPromise.close();
//                 console.log("client.close()");
//
//             }
//         }
//
//     });
//
//
// }
//
// function reserveSetSeats(documents, places, res, uid, o_id){
//     let event=documents[0];
//     console.log('event seats // uid');
//     console.log(uid);
//     console.log('places');
//     console.log(places);
//     // console.log('event.places.JSON.PARSE');
//     // console.log(JSON.parse(event.places));
//     let eventPlacesOBJ=JSON.parse(event.places);
//
//     for(let place of places){
//         console.log(place);
//         for(let eventPlace of eventPlacesOBJ){
//             // console.log(eventPlace);
//
//             if(place.row === eventPlace.row && place.seat === eventPlace.seat){
//                 eventPlace.status='reserved';
//                 eventPlace.uid=uid[0];
//                 console.log(uid[0]);
//                 eventPlace.time=Date.now();
//             }
//         }
//     }
//
//     // console.log(eventPlacesOBJ);
//
//     let eventPlaces=JSON.stringify(eventPlacesOBJ);
//
//
//
//
//     var mongoClientPromise1 = mongoClient.connect(async function (err, client) {
//         const db = client.db(dbName);
//         var answer = "0";
//         // var allProductsArray = db.collection("items").find().toArray();
//         try {
//
//
//
//             await db.collection("events").updateOne({"_id" : o_id }, { $set: {places: eventPlaces } }, function(err, documents) {
//                 if (err) throw err;
//                 res.end(JSON.stringify({ msg: "OK" }));
//             });
//         } finally {
//             if (db) mongoClientPromise1.close();
//             console.log("client.close()");
//
//         }
//
//
//     });
//
//     // res.end(JSON.stringify({ msg: "OK" }));
//
// }
//
// function searchReserve(time){
//     var mongoClientPromise2 = mongoClient.connect(async function (err, client) {
//         if (err){
//             console.error('An error occurred connecting to MongoDB: ',err);
//         }else {
//             const db = client.db(dbName);
//             var answer = "0";
//             // var allProductsArray = db.collection("phones").find().toArray();
//             try {
//
//
//                 await db.collection("events").find().toArray(function (err, documents) {
//                     // console.log(documents);
//
//                     searchReservedSeats(documents, time);
//
//
//                 });
//             } finally {
//                 if (db) mongoClientPromise2.close();
//                 console.log("client.close()");
//
//             }
//         }
//
//     });
// }
//
//
// function searchReservedSeats(events, time){
//     console.log('searchReservedSeats');
//     let timeDifference=600000;
//
//     for(let event of events){
//         let seats =JSON.parse(event.places);
//             for(let seat of seats){
//                 if(seat.status == "reserved" && (seat.time+timeDifference)<time){
//                     seat.status='free';
//                     seat.time ='';
//                     seat.uid ='';
//                     console.log(seat.row);
//                     console.log(seat.seat);
//
//                 }
//             }
//          let eventPlaces=JSON.stringify(seats);
//         let o_id = new mongo.ObjectID(event._id);
//             console.log('o_id= '+o_id);
//
//         var mongoClientPromise3 = mongoClient.connect(async function (err, client) {
//             const db = client.db(dbName);
//             var answer = "0";
//             // var allProductsArray = db.collection("items").find().toArray();
//             try {
//
//
//
//                 await db.collection("events").updateOne({"_id" : o_id }, { $set: {places: eventPlaces } }, function(err, documents) {
//                     if (err) throw err;
//                 });
//             } finally {
//                 if (db) mongoClientPromise3.close();
//                 console.log("client.close()");
//
//             }
//
//
//         });
//
//
//
//
//
//     }
//
//
//
// }
//
// // -------------------------------------------------------- reserve ------------------------------------------------------------------------
//
//
// // -------------------------------------------------------- PDF ------------------------------------------------------------------------
//
// app.post('/getpdf',(req,res)=>{
//     console.log("We are in getpdf");
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.header('Access-Control-Allow-Headers', "*");
//
//
//     var post = req.body;
//
//     let orderId = post.orderId;
//
// console.log('');
// console.log('');
// console.log('orderId');
// console.log(orderId);
//     console.log('');
//     console.log('');
//
//     // let order = wait.for(getOrderById(orderId));
//     getOrderById(orderId, res);
//     // console.log(order);
//
//
//
// });
//
// function fontPath(file) {
//     return path.resolve('pdfmake', 'test-env', 'tests', 'fonts', file);
// }
//
//
//
// function generatePdf(docDefinition, callback) {
//
//     try {
//         const fontDescriptors = {
//             Roboto: {
//                 normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
//                 bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
//                 italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
//                 bolditalics: 'node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf'
//             }
//         };
//
//         const printer = new pdfMakePrinter(fontDescriptors);
//         const doc = printer.createPdfKitDocument(docDefinition);
//
//         let chunks = [];
//
//         doc.on('data', (chunk) => {
//             chunks.push(chunk);
//         });
//
//         doc.on('end', () => {
//             const result = Buffer.concat(chunks);
//             let obj={};
//             obj.doc='data:application/pdf;base64,' + result.toString('base64');
//             callback(obj);
//             // callback('data:application/pdf;base64,' + result.toString('base64'));
//         });
//
//         doc.end();
//
//     } catch(err) {
//         throw(err);
//     }
// }
//
//
// function sendPDF(documents, res) {
//
//     console.log("documents in sendPDF");
//     console.log(documents);
//     console.log("Places");
//     console.log(documents[0].places);
//
//     let content = [];
//     content.push('This is your order id:'+documents[0]._id+ '\n ');
//     for( let plase of documents[0].places){
//         content.push("row: "+ plase.row + ", seat: "+plase.seat+" \n");
//     }
//     const docDefinition = {
//         // content: ['This is your order id:'+123+ '\n next \n next']
//         content:content
//     };
//     generatePdf(docDefinition, (response) => {
//         res.setHeader('Content-Type', 'application/pdf');
//         res.send(response); // sends a base64 encoded string to client
//     });
//
// }
//
// // -------------------------------------------------------- PDF ------------------------------------------------------------------------
//





function sendAnswer(data,resolve,reject) {
    console.log('sendAnswer()');
    console.log('data');

    let res = data.res;
    // console.log('res');
    // console.log(res);
    delete data.res;
    console.log(data);

    if (data){
        if(data.msg){
            res.end(JSON.stringify({ msg: "OK" }));
        }
        else {
            res.end(JSON.stringify(data));

        }
    }
     else{
        res.end(JSON.stringify({ msg: "Error occurred" }));
    }

    resolve();
}
