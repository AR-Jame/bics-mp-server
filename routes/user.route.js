const express = require('express');
const multer = require('multer');
const router = express.Router();
require('dotenv').config();
const cloudinary = require('../utils/cloudinary')
const { db } = require('../utils/dbconnect');
const { ObjectId } = require('mongodb');

const upload = multer();

const userCollection = db.collection('users');
const transporter = require('../utils/BrevoConfig')
const { verifyJWT } = require('../middlewares/jwt')

async function createIndexes() {
  try {
    await userCollection.createIndex({ email: 1 });
    await userCollection.createIndex({ status: 1 });
    await userCollection.createIndex({ level: 1 });
    await userCollection.createIndex({ area: 1 });
    await userCollection.createIndex({ status: 1, level: 1, area: 1 });
    console.log("Indexes created successfully ✅");
  } catch (error) {
    console.error("Error creating indexes ❌", error);
  }
}
// post a new request with status pending
router.post('/', upload.single('image'), async (req, res) => {
  const body = req.body;

  // check the email if it it's exists
  const checking = await userCollection.findOne({ email: body.email })
  if (checking) return res.status(502).send({ info: 'This email already exists.' })
  const responsibility = JSON.parse(body.responsibility);
  const activeRole = JSON.parse(body.activeRole);

  cloudinary.uploader.upload_stream(
    {
      resource_type: 'image',
      eager: [
        {
          width: 700,
          height: 700,
          crop: "fill",
          gravity: "auto",
          quality: "auto",
          fetch_format: "auto"
        }
      ]
    },
    async (error, result) => {
      if (error) return res.status(501).send(error);
      console.log(result);
      if (result?.secure_url) {
        const response = await userCollection.insertOne({ ...body, image: result.eager[0].secure_url, responsibility, activeRole, status: 'pending', });
        res.status(200).send(response)
      }

    }).end(req.file.buffer)
})

// get all requested user
router.get('/request', verifyJWT, async (req, res) => {
  const query = { status: 'pending' };
  const result = await userCollection.find(query).toArray();;
  res.send(result)
})

// get requested user by email
router.get('/accept-req/:email', async (req, res) => {
  const email = req.params.email;
  const filer = { email: email };
  const result = await userCollection.findOne(filer);
  if (!result) res.send({ status: 'not' })
  else if (result.status === 'approved') res.send({ status: 'ok', imageURL: result.image });
  else if (result.status === 'pending') res.send({ status: 'pending' });
  else if (result.status === 'user') res.send({ status: 'user' })
})

// update a user to 'approved'
router.put('/accept-req/:id', verifyJWT, async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  console.log(id, body);

  const info = await transporter.sendMail({
    from: '"বিআইসিএস, মাতুয়াইল পূর্ব" <ar.jame333@gmail.com>',
    to: body.email,
    subject: 'রেজিস্ট্রেশন কনফারমেশন',
    html: `
          <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Registration Invitation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
        text-align: center;
      }
      .container {
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 500px;
        margin: auto;
      }
      h2 {
        color:rgb(255, 255, 255);
      }
      p {
        color: #555;
        font-size: 16px;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        padding: 12px 20px;
        background-color: #0288D1;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        margin-top: 15px;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>

    <div class="container">
      <h2>আসসালামু আলাইকুম!</h2>
      <p>বাংলাদেশ ইসলামী ছাত্রশিবির, মাতুয়াইল পূর্ব থানার পক্ষ থেকে আপনাকে স্বাগতম।</p>
      <p>আপনার রেজিস্ট্রেশন সম্পন্ন করতে নিচের লিংকে ক্লিক করুন:</p>

      <a href="https://bics-mp.web.app/accept-req" class="button">রেজিস্ট্রেশন করুন</a>

      <p class="footer">যদি উপরের বাটন কাজ না করে, অনুগ্রহ করে এই লিংকটি কপি করে ব্রাউজারে পেস্ট করুন:<br>
      <a href="https://bics-mp.web.app/accept-req">https://bics-mp.web.app/accept-req</a></p>
    </div>

  </body>
  </html>
          `
  })
  console.log(info);


  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: { status: 'approved' }
  }
  const result = userCollection.updateOne(filter, updatedDoc);
  res.send(result);

})

// update a user to 'user'
router.put('/accept-req-email/:email', async (req, res) => {
  const { email } = req.params;
  console.log(email);
  const filter = { email: email };
  updatedDoc = { $set: { status: 'user' } }
  const result = await userCollection.updateOne(filter, updatedDoc)
  res.send(result);
})

// delete a requested user from db
router.delete('/decline-req/:id', async (req, res) => {
  const id = req.params.id;
  const body = req.body;


  const info = await transporter.sendMail({
    from: '"বিআইসিএস, মাতুয়াইল পূর্ব" <ar.jame333@gmail.com>',
    to: body.email,
    subject: 'রেজিস্ট্রেশন কনফারমেশন',
    html: `
          <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Registration Invitation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
        text-align: center;
      }
      .container {
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 500px;
        margin: auto;
      }
      h2 {
        color:rgb(255, 255, 255);
      }
      p {
        color: #555;
        font-size: 16px;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        padding: 12px 20px;
        background-color: #0288D1;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        margin-top: 15px;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>

    <div class="container">
      <h2>আসসালামু আলাইকুম!</h2>
      <p>বাংলাদেশ ইসলামী ছাত্রশিবির, মাতুয়াইল পূর্ব থানার পক্ষ থেকে আপনাকে স্বাগতম।</p>
      <p>আমরা দুঃখের সাথে জানাচ্ছি যে, আপনার রিকুয়েস্ট একসেপ্ট করা হয়নি। </p>
      <p>আপনাকে কষ্ট দেয়ার জন্য, আমরা আন্তরিক ভাবে ক্ষমা প্রার্থী।</p>
    </div>

  </body>
  </html>
          `
  })
  const filter = { _id: new ObjectId(id) };
  const result = await userCollection.deleteOne(filter);
  res.send(result);
})


// get all manpower with status 'user'
router.get('/', verifyJWT, async (req, res) => {
  const { level, area, areaName, delegate, projection } = req.query
  let query = { status: 'user' };
  let option = {};


  if (level) {
    query.level = level
  }
  else if (delegate) {
    const delegateArr = delegate.split(",")
    query.level = { $in: delegateArr }
  }

  if (projection) {
    option.projection = { name: 1 }
  }


  switch (area) {
    case 'থানা':
      query.thana = areaName
      break
    case 'ওয়ার্ড':
      query.ward = areaName
      break
    case 'উপশাখা':
      query.unit = areaName
      break
  }
  console.log(query);

  const result = await userCollection.find(query, option).toArray();
  res.send(result)
})


// get single user data or Profile
router.get('/me/:email', async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const data = await userCollection.findOne(filter);
  res.send(data)
})


//update a user Profile
router.patch('/profile/:email', upload.single('image'), verifyJWT, async (req, res) => {
  const { prevImage, name, phone, email, level, institutionName, batch, group, workerDate, associateDate, memberDate, thana, ward, unit, responsibility } = req.body;
  const query = { email: req.params.email };
  let updatedData = {
    name: name,
    phone: phone,
    email: email,
    level: level,
    institutionName: institutionName,
    batch: batch,
    group: group,
    workerDate: workerDate,
    associateDate: associateDate,
    memberDate: memberDate,
    thana: thana,
    ward: ward,
    unit: unit,
    responsibility: JSON.parse(responsibility),
  }

  // delete image & upload new image and update Db
  if (req?.file?.buffer && prevImage) {
    const publicId = prevImage
      .split('/').slice(-2).join('/')
      .replace(/\.[^.]+$/, '');

    const destroyed = await cloudinary.uploader.destroy(publicId)
    console.log(destroyed);

    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        eager: [
          {
            width: 700,
            height: 700,
            crop: "fill",
            gravity: "auto",
            quality: "auto",
            fetch_format: "auto"
          }
        ]
      },
      async (err, result) => {
        if (err) return res.status(501).send(err)
        console.log(result);
        updatedData = { ...updatedData, image: result.secure_url };
        const response = await userCollection.updateOne(query, { $set: { ...updatedData } })
        console.log(response)
        res.send({ response, updatedImg: result.eager.secure_url })
      }
    ).end(req.file.buffer);

    return
  }

  const result = await userCollection.updateOne(query, { $set: { ...updatedData } });
  console.log(result);
  res.send(result);
})


// change a user role by PUT 
router.put('/me/:email', async (req, res) => {
  const body = req.body;
  const email = req.params.email;
  console.log(body, email);
  const filter = { email: email }
  const updatedDoc = { $set: { activeRole: body } };
  const result = await userCollection.updateOne(filter, updatedDoc)
  res.send(result);
})


// get user related data for program
router.get('/delegate', verifyJWT, async (req, res) => {
  const { area, areaName, delegate } = req.query;
  let query = {};

  switch (area) {
    case 'থানা':
      query = { ...query, thana: areaName }
      break
    case 'ওয়ার্ড':
      query = { ...query, ward: areaName }
      break
    case 'উপশাখা':
      query = { ...query, unit: areaName }
      break
  }
})



router.put('/temp', async (req, res) => {
  const updatedDoc = await userCollection.updateMany({}, { $unset: { phoneticName: "" } })
  res.send(updatedDoc)
})

createIndexes()
module.exports = { router, userCollection };