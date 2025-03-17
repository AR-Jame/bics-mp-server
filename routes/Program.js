const express = require('express');
const { db } = require('../utils/dbconnect')
const router = express.Router();

const programCollection = db.collection('programs');

router.get('/', async (req, res) => {
    const { areaName } = req.query;
    const filter = { areaName: areaName }
    const result = await programCollection.find(filter).toArray();
    res.send(result)
})

router.post('/', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = await programCollection.insertOne(body)
    res.send(result)
})
module.exports = router