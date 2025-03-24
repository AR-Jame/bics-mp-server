const express = require('express');;
const { db } = require('../utils/dbconnect')
const router = express.Router();
const { userCollection } = require('./user.route')
const { programCollection } = require("./Program");
const { wisherCollection } = require('./wisher.route')

const wardCollection = db.collection('wards');
const unitCollection = db.collection('unit');

// post a new ward
router.post('/ward', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = wardCollection.insertOne(body);
    res.send(result)
})

// post a new unit
router.post('/unit', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = unitCollection.insertOne(body);
    res.send(result)
})

// get all wards
router.get('/ward', async (req, res) => {
    const result = await wardCollection.find().toArray();
    res.send(result)

})

// get unit data according to the wards and if ward query don't find then get all unit data
router.get('/unit', async (req, res) => {
    const query = req.query.ward;
    console.log(query);
    let filter = {}
    if (query) {
        filter = { ward: query };
    }

    const result = await unitCollection.find(filter).toArray();
    res.send(result)

})

// get all data (user, program) of a ward
router.get('/details/:areaName', async (req, res) => {
    const areaName = req.params.areaName;
    const { query } = req.query;
    const area = JSON.parse(query)
    console.log(areaName, area);

    const newDate = new Date().toLocaleDateString();
    const filter = { [area]: areaName, status: 'user' }
    const projection = { projection: { name: 1, level: 1 } }
    const users = await userCollection.find(filter, projection).toArray();
    const wishers = await wisherCollection?.find({ [area]: areaName }, { projection: { name: 1, phone: 1 } }).toArray();
    const programFilter = { areaName: areaName, date: { $regex: newDate.split("/")[2] } }
    const programs = await programCollection.find(programFilter, { projection: { name: 1, attendance: 1, area: 1 } }).toArray();
    let areaData;
    let units;
    if (area === 'ward') {
        areaData = await wardCollection.find({ ward: areaName }).toArray();
        units = await unitCollection.find({ ward: areaName }).toArray();
    }
    else if (area === 'unit') {
        areaData = await unitCollection.find({ unit: areaName }).toArray();
    }
    res.send({ users, programs, wishers, areaData, units })
})



module.exports = router;