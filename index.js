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
const dbName="ticketservice";

let timeCicle=0;
let timeout=60000;

setInterval(function() {
    console.log('setInterval');
    timeCicle++;
    console.log(timeCicle);

    var timeInMs = Date.now();
    console.log(timeInMs);

    searchReserve(timeInMs);

}, timeout);

var app=express();

var cors = require('cors');

app.use(cors());


app.get('/',(req,res)=>res.send("Hi"));


app.listen(process.env.PORT || 5000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

// app.use(express.bodyParser());
app.use(bodyParser.json());



// -------------------------------------------------------- events --------------------------------------------------------------------------



app.post('/eventadd',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let date="";
    let description="";
    let eventName="";
    let eventStar="";
    let hall="";
    let imgMain="";
    let imgPreview="";
    let places=[];
    let priceEnd=0;
    let priceStart=0;
    let ticketsAvailable=0;
    let category="";
    // let place={};
    // place.category="";
    // place.price=0;
    // place.row=0;
    // place.seat=0;
    // var obj=JSON.stringify(works);
    // works=obj;
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
        var post = qs.parse(body);

        console.log(body);
        date=post.date;
        description=post.description;
        eventName=post.eventName;
        eventStar=post.eventStar;
        hall=post.hall;
        imgMain=post.imgMain;
        imgPreview=post.imgPreview;
        places=post.places;
        priceEnd=post.priceEnd;
        priceStart=post.priceStart;
        ticketsAvailable=post.ticketsAvailable;
        category=post.category;

        eventAdd(date,description,eventName,eventStar,hall,imgMain,imgPreview,places,priceEnd,priceStart,ticketsAvailable,category);
        res.end(JSON.stringify({ msg: "OK" }));
    });

});

function eventAdd(date,description,eventName,eventStar,hall,imgMain,imgPreview,places,priceEnd,priceStart,ticketsAvailable,category) {

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);

        const collection = db.collection("events");
        let event = {
                    category:category,
                    date: date,
                    description:description,
                    eventName:eventName,
                    eventStar:eventStar,
                    hall:hall,
                    imgMain:imgMain,
                    imgPreview:imgPreview,
                    places:places,
                    priceEnd:priceEnd,
                    priceStart:priceStart,
                    ticketsAvailable:ticketsAvailable};
        try {
            await collection.insertOne(event, function (err, result) {

                if (err) {
                    return console.log(err);
                }
                console.log(result.ops);

            });
        } finally {
            if (db) mongoClientPromise.close();
            console.log("client.close()");
            res.end(JSON.stringify({ msg: "OK" }));
        }
    });


}

app.post('/getevents',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let id="";

    let body = '';
    // req.on('data', chunk => {
    //     body += chunk.toString(); // convert Buffer to string
    // });
    // req.on('end', () => {
    //     var post = qs.parse(body);
    //
    //     console.log(body);
    //     id=post.id;
    //
    //     getEvents(id,res);
    // });

    getEvents(id,res);

});

function getEvents(id,res){
    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {


                await db.collection("events").find().toArray(function (err, documents) {
                    // console.log(documents);

                    res.end(JSON.stringify(documents));


                });
            } finally {
                if (db) mongoClientPromise.close();
                console.log("client.close()");

            }
        }

    });
}

app.post('/geteventbyid',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let id="";

    let body = '';
    // req.on('data', chunk => {
    //     body += chunk.toString(); // convert Buffer to string
    // });
    // req.on('end', () => {
    //     var post = qs.parse(body);
    //
    //     console.log(body);
    //     id=post.id;
    //
    //     getEvents(id,res);
    // });

    var post = req.body;
    id=post.id;
    getEventById(id,res);

});

function getEventById(id,res){

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {
                let o_id = new mongo.ObjectID(id);

                await db.collection("events").find({ "_id" : o_id }).toArray(function (err, documents) {
                    // console.log(documents);

                    res.end(JSON.stringify(documents));


                });
            } finally {
                if (db) mongoClientPromise.close();
                console.log("client.close()");

            }
        }

    });
}





// -------------------------------------------------------- events --------------------------------------------------------------------------



// -------------------------------------------------------- users --------------------------------------------------------------------------


app.post('/registration',(req,res)=>{
    console.log("We are in registration");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");
    let gender="";
    let name="";
    let surname="";
    let company="";
    let street="";
    let house="";
    let addinfo="";
    let postcode="";
    let city="";
    let country="";
    let email="";
    let password="";
    let phone="";
    let addphone="";

    let body = '';
    // console.log(req);
    // console.log(req.toString());
    console.log("req.data.body");
    console.log(req.body);

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
        gender=post.gender;
        name=post.name;
        surname=post.surname;
        company=post.company;
        street=post.street;
        house=post.house;
        addinfo=post.addinfo;
        postcode=post.postcode;
        city=post.city;
        country=post.country;
        email=post.email;
        password=post.password;
        phone=post.phone;
        addphone=post.addphone;

        userAdd(gender,name,surname,company,street,house,addinfo,postcode,city,country,email,password,phone,addphone);
        res.end(JSON.stringify({ msg: "OK" }));
    // });
// console.log(req.body.gender);

});

function userAdd(gender,name,surname,company,street,house,addinfo,postcode,city,country,email,password,phone,addphone) {

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);

        const collection = db.collection("users");
        let user = {
            gender:gender,
            name: name,
            surname:surname,
            company:company,
            street:street,
            house:house,
            addinfo:addinfo,
            postcode:postcode,
            city:city,
            country:country,
            email:email,
            password:password,
            phone:phone,
            addphone:addphone};
        try {
            await collection.insertOne(user, function (err, result) {

                if (err) {
                    return console.log(err);
                }
                console.log(result.ops);

            });
        } finally {
            if (db) mongoClientPromise.close();
            console.log("client.close()");
            res.end(JSON.stringify({ msg: "OK" }));
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

                    res.end(JSON.stringify(documents));


                });
            } finally {
                if (db) mongoClientPromise.close();
                console.log("client.close()");

            }
        }

    });
}

// -------------------------------------------------------- users --------------------------------------------------------------------------

// -------------------------------------------------------- orders --------------------------------------------------------------------------



app.post('/orderadd',(req,res)=>{
    console.log("We are in orderadd");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");
    let eventId="";
    let uid="";
    let places=[];
    let paymentID="";
    let paymentCart="";
    let paymentTime="";
    let paymentEmail="";
    let paymentPayerId="";
    let paymentPayerAddress="";

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
    eventId=post.id;
    uid=post.uid;
    places=post.places;
    paymentID=post.paymentID;
    paymentCart=post.paymentCart;
    paymentTime=post.paymentTime;
    paymentEmail=post.paymentEmail;
    paymentPayerId=post.paymentPayerId;
    paymentPayerAddress=post.paymentPayerAddress;

    orderAddStart(eventId, uid, places,paymentID,paymentCart,paymentTime,paymentEmail,paymentPayerId,paymentPayerAddress, res);
    // res.end(JSON.stringify({ msg: "OK" }));
    // });
// console.log(req.body.gender);

});

function orderAddStart(eventId, uid, places,paymentID,paymentCart,paymentTime,paymentEmail,paymentPayerId,paymentPayerAddress, res) {

    console.log("We are in func orderadd");
    console.log(paymentID);
    console.log(paymentCart);
    console.log(paymentTime);
    console.log(paymentEmail);
    console.log(paymentPayerId);
    console.log(paymentPayerAddress);


    var mongoClientPromise6 = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {
                let o_id = new mongo.ObjectID(eventId);
                console.log('o_id');
                console.log(o_id);

                await db.collection("events").find({ "_id" : o_id }).toArray(function (err, documents) {
                    // console.log(documents);

                    // res.end(JSON.stringify(documents));
                    eventSetSeats(documents, places, res, uid, o_id,paymentID,paymentCart,paymentTime,paymentEmail,paymentPayerId,paymentPayerAddress,eventId);

                });
            } finally {
                if (db) mongoClientPromise6.close();
                console.log("client.close()");

            }
        }

    });


}

function eventSetSeats(documents, places, res, uid, o_id,paymentID,paymentCart,paymentTime,paymentEmail,paymentPayerId,paymentPayerAddress,eventId){
    let event=documents[0];
    console.log('event seats // uid');
    console.log(uid);
    // console.log('event.places');
    // console.log(event.places);
    // console.log('event.places.JSON.PARSE');
    // console.log(JSON.parse(event.places));
    let eventPlacesOBJ=JSON.parse(event.places);

    for(let place of places){
        // console.log(place);
        for(let eventPlace of eventPlacesOBJ){
            // console.log(eventPlace);

            if(place.row === eventPlace.row && place.seat === eventPlace.seat){
                if(eventPlace.status==="reserved" && eventPlace.uid==uid[0]) {
                    eventPlace.status = 'sold';
                    eventPlace.uid = uid[0];
                    eventPlace.time = Date.now();
                }
                else {
                    res.end(JSON.stringify({ msg: "These places are no longer available" }));
                }
            }
        }
    }

    // console.log(eventPlacesOBJ);

    let eventPlaces=JSON.stringify(eventPlacesOBJ);




    var mongoClientPromise5 = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        var answer = "0";
        // var allProductsArray = db.collection("items").find().toArray();
        try {



            await db.collection("events").updateOne({"_id" : o_id }, { $set: {places: eventPlaces } }, function(err, documents) {
                if (err) throw err;

                //ToDo   ---------    Add order to the order collection ----
                orderAdd( places, res, uid, eventId,paymentID,paymentCart,paymentTime,paymentEmail,paymentPayerId,paymentPayerAddress);
            });
        } finally {
            if (db) mongoClientPromise5.close();
            console.log("client.close()");

        }


    });

                // res.end(JSON.stringify({ msg: "OK" }));

}



function orderAdd( places, res, uid, eventId,paymentID,paymentCart,paymentTime,paymentEmail,paymentPayerId,paymentPayerAddress){
    console.log('orderAdd');

    var mongoClientPromise4 = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);

        const collection = db.collection("orders");
        let order = {
            uid:uid,
            eventId: eventId,
            paymentID:paymentID,
            paymentCart:paymentCart,
            paymentTime:paymentTime,
            paymentEmail:paymentEmail,
            paymentPayerId:paymentPayerId,
            paymentPayerAddress:paymentPayerAddress,
            places:places,
            };
        try {
            await collection.insertOne(order, function (err, result) {

                if (err) {
                    return console.log(err);
                }
                res.end(JSON.stringify({ msg: "OK" , orderId: result.ops[0]._id}));

            });
        } finally {
            if (db) mongoClientPromise4.close();
            console.log("client.close()");
        }
    });

    // res.end(JSON.stringify({ msg: "OK" }));

}




  function getOrderById(id, res){

    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {
                let o_id = new mongo.ObjectID(id);

                await db.collection("orders").find({ "_id" : o_id }).toArray(function (err, documents) {


                    sendPDF(documents,res);




                });
            } finally {
                if (db) mongoClientPromise.close();
                console.log("client.close()");

            }
        }

    });
}










// -------------------------------------------------------- orders --------------------------------------------------------------------------



// -------------------------------------------------------- reserve ------------------------------------------------------------------------

app.post('/reserveadd',(req,res)=>{
    console.log("We are in reserveadd");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");
    let eventId="";
    let uid="";
    let places=[];

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
    eventId=post.id;
    uid=post.uid;
    places=post.places;


    reserveAdd(eventId, uid, places, res);
    // res.end(JSON.stringify({ msg: "OK" }));
    // });
// console.log(req.body.gender);

});

function reserveAdd(eventId, uid, places, res) {

    console.log("We are in func orderadd");


    var mongoClientPromise = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {
                let o_id = new mongo.ObjectID(eventId);
                console.log('o_id');
                console.log(o_id);

                await db.collection("events").find({ "_id" : o_id }).toArray(function (err, documents) {
                    // console.log(documents);

                    // res.end(JSON.stringify(documents));
                    reserveSetSeats(documents, places, res, uid, o_id);

                });
            } finally {
                if (db) mongoClientPromise.close();
                console.log("client.close()");

            }
        }

    });


}

function reserveSetSeats(documents, places, res, uid, o_id){
    let event=documents[0];
    console.log('event seats // uid');
    console.log(uid);
    console.log('places');
    console.log(places);
    // console.log('event.places.JSON.PARSE');
    // console.log(JSON.parse(event.places));
    let eventPlacesOBJ=JSON.parse(event.places);

    for(let place of places){
        console.log(place);
        for(let eventPlace of eventPlacesOBJ){
            // console.log(eventPlace);

            if(place.row === eventPlace.row && place.seat === eventPlace.seat){
                eventPlace.status='reserved';
                eventPlace.uid=uid[0];
                console.log(uid[0]);
                eventPlace.time=Date.now();
            }
        }
    }

    // console.log(eventPlacesOBJ);

    let eventPlaces=JSON.stringify(eventPlacesOBJ);




    var mongoClientPromise1 = mongoClient.connect(async function (err, client) {
        const db = client.db(dbName);
        var answer = "0";
        // var allProductsArray = db.collection("items").find().toArray();
        try {



            await db.collection("events").updateOne({"_id" : o_id }, { $set: {places: eventPlaces } }, function(err, documents) {
                if (err) throw err;
                res.end(JSON.stringify({ msg: "OK" }));
            });
        } finally {
            if (db) mongoClientPromise1.close();
            console.log("client.close()");

        }


    });

    // res.end(JSON.stringify({ msg: "OK" }));

}

function searchReserve(time){
    var mongoClientPromise2 = mongoClient.connect(async function (err, client) {
        if (err){
            console.error('An error occurred connecting to MongoDB: ',err);
        }else {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("phones").find().toArray();
            try {


                await db.collection("events").find().toArray(function (err, documents) {
                    // console.log(documents);

                    searchReservedSeats(documents, time);


                });
            } finally {
                if (db) mongoClientPromise2.close();
                console.log("client.close()");

            }
        }

    });
}


function searchReservedSeats(events, time){
    console.log('searchReservedSeats');
    let timeDifference=600000;

    for(let event of events){
        let seats =JSON.parse(event.places);
            for(let seat of seats){
                if(seat.status == "reserved" && (seat.time+timeDifference)<time){
                    seat.status='free';
                    seat.time ='';
                    seat.uid ='';
                    console.log(seat.row);
                    console.log(seat.seat);

                }
            }
         let eventPlaces=JSON.stringify(seats);
        let o_id = new mongo.ObjectID(event._id);
            console.log('o_id= '+o_id);

        var mongoClientPromise3 = mongoClient.connect(async function (err, client) {
            const db = client.db(dbName);
            var answer = "0";
            // var allProductsArray = db.collection("items").find().toArray();
            try {



                await db.collection("events").updateOne({"_id" : o_id }, { $set: {places: eventPlaces } }, function(err, documents) {
                    if (err) throw err;
                });
            } finally {
                if (db) mongoClientPromise3.close();
                console.log("client.close()");

            }


        });





    }



}

// -------------------------------------------------------- reserve ------------------------------------------------------------------------


// -------------------------------------------------------- PDF ------------------------------------------------------------------------

app.post('/getpdf',(req,res)=>{
    console.log("We are in getpdf");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', "*");


    var post = req.body;

    let orderId = post.orderId;

console.log('');
console.log('');
console.log('orderId');
console.log(orderId);
    console.log('');
    console.log('');

    // let order = wait.for(getOrderById(orderId));
    getOrderById(orderId, res);
    // console.log(order);



});

function fontPath(file) {
    return path.resolve('pdfmake', 'test-env', 'tests', 'fonts', file);
}



function generatePdf(docDefinition, callback) {

    try {
        const fontDescriptors = {
            Roboto: {
                normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
                bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
                italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
                bolditalics: 'node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf'
            }
        };

        const printer = new pdfMakePrinter(fontDescriptors);
        const doc = printer.createPdfKitDocument(docDefinition);

        let chunks = [];

        doc.on('data', (chunk) => {
            chunks.push(chunk);
        });

        doc.on('end', () => {
            const result = Buffer.concat(chunks);
            let obj={};
            obj.doc='data:application/pdf;base64,' + result.toString('base64');
            callback(obj);
            // callback('data:application/pdf;base64,' + result.toString('base64'));
        });

        doc.end();

    } catch(err) {
        throw(err);
    }
}


function sendPDF(documents, res) {

    console.log("documents in sendPDF");
    console.log(documents);
    console.log("Places");
    console.log(documents[0].places);

    let content = [];
    content.push('This is your order id:'+documents[0]._id+ '\n ');
    for( let plase of documents[0].places){
        content.push("row: "+ plase.row + ", seat: "+plase.seat+" \n");
    }
    const docDefinition = {
        // content: ['This is your order id:'+123+ '\n next \n next']
        content:content
    };
    generatePdf(docDefinition, (response) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.send(response); // sends a base64 encoded string to client
    });

}

// -------------------------------------------------------- PDF ------------------------------------------------------------------------






