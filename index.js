const express = require('express');
const cors = require('cors');
const { run } = require('./utils/dbconnect');
require('dotenv').config();
const cookieParser = require('cookie-parser')

const app = express();
const PORT = process.env.PORT || 5000;


// global middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        // TODO: i have to write the actual url of my frontend.
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser())




// db connection
run();

const { router: wisherRoute } = require('./routes/wisher.route')
const { router: userRoute } = require('./routes/user.route');
const wardnUnit = require('./routes/WardnUnit')
const { router: jwtRoute } = require('./middlewares/jwt');
const { router: programRoute } = require('./routes/Program')
const { router: supporterRoute } = require('./routes/supporter')

app.use('/user', userRoute);
app.use('/wisher', wisherRoute);
app.use('/wardnunit', wardnUnit);
app.use('/', jwtRoute);
app.use('/program', programRoute);
app.use('/supporter', supporterRoute)

app.get('/', (req, res) => {
    res.send('alhamdulillah....');
})


app.listen(PORT, () => {
    console.log(`port is running in ${PORT}`);
})

