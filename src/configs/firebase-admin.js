var firebase = require("firebase-admin");

var serviceAccount = require("../../firebase-admin.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  storageBucket: "gs://workwise-d7df1.appspot.com",
});

module.exports = firebase;
