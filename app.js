const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
//console.log(process.env.NODE_ENV);
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data santization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Serving static files
app.use(express.static(`${__dirname}/public`));

//Test Middlewares
app.use((req, res, next) => {
  console.log('Hello from the middleware👀');
  console.log(process.env.NODE_ENV);
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// 3) ROUTES

//Mounting the Routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  //   const err = new Error(`Can't find ${req.originalUrl} on this server`);
  //   err.status = 'fail';
  //   err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

// 4) START SERVER

//THE REST ARCHITECTURE:
/*
    Representational States Transfer: building api in a logical way making it easier for others to consume.

1. Separate API into logical resources
2. Expose structured, resource-based URLs
3. Use HTTP methods(verbs).
4. Send data as JSON(usually).
5. Be stateless

1. Resource: Obj or representation of something, which has data associated to it. Any information that can be named can be a resource.
tours , users , reviews .

2. URL = https://www.natours.com/addNewTour 
   ENDPOINT = /addNewTour - bad method for naming your endpoints

3. HTTP methods = /addNewTour = POST => /tours        (Create)
                = /getTour    = GET => /tours/7       (Read)
                = /updateTour = PUT/PATCH => /tours/7 (Update)
                = /deleteTour = DELETE => /tours/7    (Delete)

                = /getToursByUser = GET => /users/3/tours
                = /deleteToursByUser = DELETE => /users/3/tours/9
                                            CRUD Operations
4. JSON 
    All the keys have to be strings: Objects with Key-Value Pairs, Values can be any other thing

    Use JSend to format the JSON Response before sending e.g
    {
        'status': 'sucess',
        'data': {
            'id': 5,
            'tourName': 'The Park Camper',
            'rating': '4.9',
            'guides': [
                {
                    'name': 'Steven Miller',
                    'role': 'Lead Guide'
                },
                {
                    'name': 'Lisa Brown',
                    'role': 'Tour Guide'                
                }
            ] 
        }
    }

5. Stateless RESTful API: All state is handled on the client and not on the server. This means that each request must contain all the information necessary to process a certain request. The server should not have to remember previous requests.
*/

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side!', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

//app.get('/api/v1/tours', getAllTours);
//app.post('/api/v1/tours', createTour);
//app.get('/api/v1/tours/:id', getTour);
//app.patch('/api/v1/tours/:id', updateTour);
//  app.delete('/api/v1/tours/:id', deleteTour);

// app.use((req, res, next) => {
//   console.log('Hello from the middleware👀');
//   next();
// });
