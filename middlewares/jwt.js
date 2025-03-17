const express = require('express');
const router = express.Router();
exports.router = router;
const jwt = require('jsonwebtoken');
require('dotenv').config();

const cookieOptions = require('../utils/CookieOpt');

// generate access & refresh token and set to db, cookie, memory
router.post('/jwt', async (req, res) => {
    const { email } = req.body;

    const accessToken = jwt.sign(
        { 'email': email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
        { 'email': email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    // save the refresh token in db
    // const filer = { email: email };
    // const updatedDoc = { $set: { 'refreshToken': refreshToken } }
    // await userCollection.updateOne(filer, updatedDoc);

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, cookieOptions);

    res.send({ message: 'successfully done the job' })


})

// verifyJWT middleware

const verifyJWT = (req, res, next) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) return res.status(401).send({ message: 'Unauthorized Access' });

    jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            console.log(err);
            if (err) return res.status(403).send('Forbidden access');
            req.decoded = decoded;
            next();
        }
    )


}

module.exports = { router, verifyJWT };



