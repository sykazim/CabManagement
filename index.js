const mongoose = require("mongoose");
const express = require("express");
const coursesRouter = require("./routes/Rider");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const riderauth = require("./middlewares/riderauth");
const driverauth = require("./middlewares/driverauth");
const Rider = require("./models/Rider");
const Driver = require("./models/Driver");
const Trips = require("./models/Trips");
const CabCategory = require("./models/CabCategory");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
//middleware
app.use("/cabBooking", coursesRouter);

const dbUrl =
  "mongodb+srv://syedkazim:syedkazim@cluster0.kmwfn1h.mongodb.net/?retryWrites=true&w=majority";

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose
  .connect(dbUrl, connectionParams)
  .then(() => {
    console.info("connected to the DB");
  })
  .catch((e) => {
    console.log("error:", e);
  });

// adding new rider/driver (sign-up route)
app.post("/api/register", function (req, res) {
  // taking a rider
  if (req.body.usertype === "rider") {
    //const newrider=new Rider(req.body);
    const newrider = new Rider({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
    });

    //console.log(testrider);

    Rider.findOne({ email: newrider.email }, function (err, rider) {
      if (rider)
        return res.status(400).json({ auth: false, message: "email exits" });

      newrider.save((err, doc) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ success: false });
        }
        res.status(200).json({
          success: true,
          rider: {
            firstname: doc.firstname,
            lastname: doc.lastname,
            email: doc.email,
            mobile: doc.mobile,
          },
        });
      });
    });
  } else {
    //taking a driver

    const newdriver = new Driver({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
      vehicleno: req.body.vehicleno,
      latitude: "",
      longitude: "",
      available: "no",
    });

    //console.log(testrider);

    Driver.findOne({ email: newdriver.email }, function (err, driver) {
      if (driver)
        return res.status(400).json({ auth: false, message: "email exits" });

      newdriver.save((err, doc) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ success: false });
        }
        res.status(200).json({
          succes: true,
          driver: {
            firstname: doc.firstname,
            lastname: doc.lastname,
            email: doc.email,
            mobile: doc.mobile,
            vehicleno: doc.vehicleno,
          },
        });
      });
    });
  }
});

// login rider/driver
app.post("/api/login", function (req, res) {
  if (req.body.usertype === "rider") {
    let token = req.cookies.auth;
    Rider.findByToken(token, (err, rider) => {
      if (err) return res(err);
      if (rider)
        return res.status(400).json({
          error: true,
          message: "You are already logged in",
        });
      else {
        Rider.findOne({ email: req.body.email }, function (err, rider) {
          if (!rider)
            return res.json({
              isAuth: false,
              message: " Auth failed ,email not found",
            });

          rider.comparepassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
              return res.json({
                isAuth: false,
                message: "password doesn't match",
              });

            rider.generateToken((err, rider) => {
              if (err) return res.status(400).send(err);
              res.cookie("auth", rider.token).json({
                isAuth: true,
                email: rider.email,
              });
            });
          });
        });
      }
    });
  } else {
    let token = req.cookies.auth;
    Driver.findByToken(token, (err, driver) => {
      if (err) return res(err);
      if (driver)
        return res.status(400).json({
          error: true,
          message: "You are already logged in",
        });
      else {
        Driver.findOne({ email: req.body.email }, function (err, driver) {
          if (!driver)
            return res.json({
              isAuth: false,
              message: " Auth failed ,email not found",
            });

          driver.comparepassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
              return res.json({
                isAuth: false,
                message: "password doesn't match",
              });

            driver.generateToken((err, driver) => {
              if (err) return res.status(400).send(err);
              res.cookie("auth", driver.token).json({
                isAuth: true,
                email: driver.email,
              });
            });
          });
        });
      }
    });
  }
});

//logout rider
app.get("/api/rider/logout", riderauth.auth, function (req, res) {
  req.rider.deleteToken(req.token, (err, rider) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

//logout driver
app.get("/api/driver/logout", driverauth.auth, function (req, res) {
  req.driver.deleteToken(req.token, (err, driver) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

app.get("/api/profile", riderauth.auth, function (req, res) {
  res.json({
    isAuth: true,
    id: req.rider._id,
    email: req.rider.email,
    name: req.rider.firstname + req.rider.lastname,
  });
});

app.post("/api/driver/availability", driverauth.auth, function (req, res) {
  const availability = req.body.availability;
  const email = req.body.email;
  Driver.findOneAndUpdate(
    { email: email },
    { available: availability },
    function (err, doc) {
      if (err) return res.status(400).send(err);
      res.sendStatus(200);
    }
  );
});

app.post("/api/driver/location", driverauth.auth, function (req, res) {
  const email = req.body.email;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;

  Driver.findOneAndUpdate(
    { email: email },
    { latitude: latitude, longitude: longitude },
    function (err, doc) {
      if (err) return res.status(400).send(err);
      res.sendStatus(200);
    }
  );
});

app.post("/api/rider/book", riderauth.auth, function (req, res) {
  const email = req.body.rider_email;
  const start_location = req.body.start_location;
  const end_location = req.body.end_location;
  const cabType = req.body.cabtype;
  console.log(email + start_location + end_location);
  var basefare = 0.0;
  var perkmprice = 0.0;
  var kms = 0.0;
  var price = 0.0;

  CabCategory.findOne({ name: cabType }, function (err, cab) {
    if (err) return res.status(400).send(err);
    basefare = cab.basefare;
    perkmprice = cab.perkmprice;
    console.log(basefare + " " + perkmprice);
    kms = Math.floor(Math.random() * 25);
    price = basefare;

    if (kms > 4) {
      price = price + (kms - 4) * perkmprice;
    }

    const newtrip = new Trips({
      driver_email: "",
      rider_email: email,
      start_location: start_location,
      end_location: end_location,
      status: "waiting",
      price: price,
    });

    Trips.create(newtrip, function (err, temps) {
      if (err) return res.status(400).send(err);
      res.status(200).json({
        price: price,
        rideid: temps._id,
      });
    });
  });
});

app.get("/api/driver/rides", driverauth.auth, function (req, res) {
  const query = { status: "waiting" };
  Trips.find(query, function (err, result) {
    if (err) return res.status(400).send(err);
    res.send(result);
  });
});

app.post("/api/driver/rides/:rideid", driverauth.auth, function (req, res) {
  const ride_id = req.params["rideid"];
  const driver_email = req.body.driver_email;
  const ack = req.body.acknowldegement;

  if (ack === "accept") {
    Trips.findOneAndUpdate(
      { _id: ride_id },
      { driver_email: driver_email, status: "completed" },
      function (err, doc) {
        if (err) return res.status(400).send(err);
        res.sendStatus(200);
      }
    );
  } else {
    res.send("denied");
  }
});

app.post("/api/rider/history", riderauth.auth, function (req, res) {
  //const rideremail = req.body.email;

  var email = "";

  //const query = { rider_email: rideremail ,status:'completed'};

  let token = req.cookies.auth;
  Rider.findByToken(token, (err, rider) => {
    if (err) throw err;
    if (!rider)
      return res.json({
        error: true,
      });

    email = rider.email;
    const query = { rider_email: email, status: "completed" };
    console.log("-------" + email);
    Trips.find(query, function (err, result) {
      if (err) return res.status(400).send(err);
      res.send(result);
    });
  });
});

app.get("/api/rider/status/:rideid", riderauth.auth, function (req, res) {
  const ride_id = req.params["rideid"];

  const query = { _id: ride_id };

  Trips.find(query, function (err, result) {
    if (err) return res.status(400).send(err);
    console.log(result);
    console.log(result[0].status);
    res.send(result[0].status);
  });
});

app.get("/api/rider/nearbycabs", riderauth.auth, function (req, res) {
  CabCategory.find(function (err, result) {
    if (err) return res.status(400).send(err);
    console.log(result);
    res.status(200).send(result);
  });
});

app.post("/api/category", function (req, res) {
  const name = req.body.name;
  const basefare = req.body.basefare;
  const perkmprice = req.body.perkmprice;
  const newCategory = {
    name: name,
    basefare: basefare,
    perkmprice: perkmprice,
  };
  CabCategory.create(newCategory, function (err, temps) {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

app.listen(2000, () => {
  console.log("server is running");
});
