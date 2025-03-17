const express = require('express');;
const { db } = require('../utils/dbconnect')
const router = express.Router();


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



module.exports = router;