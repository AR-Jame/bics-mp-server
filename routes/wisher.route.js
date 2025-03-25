const express = require('express');
const router = express.Router();
const cron = require('node-cron')
const { db } = require('../utils/dbconnect');

const wisherCollection = db.collection('wishers');
const { ObjectId } = require('mongodb');

// get only initial info
router.get('/', async (req, res) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
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

    // console.log(key, areaName);

    const aggregate = [
        {
            '$match': {
                [key]: areaName
            }
        },
        {
            '$unwind': {
                'path': '$payments'
            }
        },
        {
            '$match': {
                'payments.month': currentMonth
            }
        },
        {
            '$group': {
                '_id': '$_id',
                'name': {
                    '$first': '$name'
                },
                'currentPayment': {
                    '$first': '$payments'
                },
                'phone': {
                    '$first': '$phone'
                }
            }
        },
        {
            '$sort': {
                '_id': -1
            }
        }

    ]
    const result = await wisherCollection.aggregate(aggregate).toArray();
    // console.log(result);
    res.send(result)
})

// get a user specific details 
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const result = await wisherCollection.findOne(filter)
    res.send(result)
})

// add a new wisher
router.post('/', async (req, res) => {
    const body = req.body;
    const result = await wisherCollection.insertOne(body)
    res.send(result);
})


// update to 'paid' wishers
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { month } = req.body;
    console.log('from here', id, month );
    const date = new Date().toLocaleDateString('en-GB')
    const filter = { _id: new ObjectId(id), 'payments.month': month }
    const updatedDoc = {
        $set: {
            'payments.$.status': 'paid',
            'payments.$.paidAt': date,
        }
    }
    const result = await wisherCollection.updateOne(filter, updatedDoc);
    res.send(result)
})

// update a wisher related data
router.put('/update/:id', async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    console.log(id, data);

    const filter = { _id: new ObjectId(id) };
    const updatedDoc = {
        $set: {
            name: data.name,
            location: data.location,
            phone: data.phone,
            amount: data.amount,
            thana: data.thana,
            ward: data.ward,
            unit: data.unit,
        }
    };
    const result = await wisherCollection.updateOne(filter, updatedDoc);
    res.send(result);
})

// schedule that every month a new object is push in every single wisher
cron.schedule('0 0 1 * *', async () => {
    try {
        const wishers = await wisherCollection.find().toArray();
        const currentMonth = new Date().toISOString().slice(0, 7);
        console.log('time to update');

        for (const wisher of wishers) {
            const newPayment = {
                month: currentMonth,
                amount: wisher.amount,
                status: 'unpaid',
                paidAt: ''
            }
            await wisherCollection.updateOne(
                { _id: new ObjectId(wisher._id) },
                { $push: { payments: newPayment } }
            )
        }
    } catch (error) {
        console.log(error);
    }
})


// delete  a wisher
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const result = await wisherCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
})


module.exports = { wisherCollection, router };