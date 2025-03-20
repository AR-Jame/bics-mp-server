const express = require('express');
const { db } = require('../utils/dbconnect')
const router = express.Router();
const { userCollection } = require('./user.route');
const { ObjectId } = require('mongodb');
const programCollection = db.collection('programs');


router.get('/', async (req, res) => {
    const { areaName } = req.query;
    const filter = { areaName: areaName }
    const result = await programCollection.find(filter, { projection: { attendance: 0 } }).toArray();
    console.log(result);
    res.send(result)
})

router.post('/', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = await programCollection.insertOne(body)
    res.send(result)
})

router.get('/details/:id', async (req, res) => {
    const id = req.params.id;
    const program = await programCollection.find({ _id: new ObjectId(id) }).toArray();
    const attendance = program[0].attendance;
    console.log(attendance);
    const userKeys = Object.keys(attendance).map(id => new ObjectId(id));
    const pipeline = [
        {
            $match: {
                _id: { $in: userKeys }
            }
        },
        {
            $addFields: {
                attendance: {
                    $let: {
                        vars: {
                            status: {
                                $arrayElemAt: [
                                    Object.entries(attendance).map(([key, value]) => ({
                                        _id: new ObjectId(key),
                                        status: value
                                    })),
                                    { $indexOfArray: [userKeys, "$_id"] }
                                ]
                            }
                        },
                        in: "$$status.status"
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                attendance: 1,
                phone: 1
            }
        }
    ];
    const users = await userCollection.aggregate(pipeline).toArray();
    res.send({ users, program })
})
module.exports = { router, programCollection }