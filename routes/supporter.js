const express = require('express');
const { db } = require('../utils/dbconnect');
const { ObjectId } = require('mongodb');
const router = express.Router();

const supporterCollection = db.collection('supporters');

router.get('/', async (req, res) => {
    const { area, areaName } = req.query;
    let key;
    switch (area) {
        case 'থানা':
            key = 'thana'
            break
        case 'ওয়ার্ড':
            key = 'ward'
            break
        case 'উপশাখা':
            key = 'unit'
            break
    }
    const result = await supporterCollection.find({ [key]: areaName }).toArray();
    res.send(result)
});

router.post('/', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = await supporterCollection.insertOne(body);
    res.send(result);
})

router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const result = await supporterCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
})

module.exports = { router }