import mongoose from 'mongoose';

const AutoIncrement = require('mongoose-sequence')(mongoose);

export default AutoIncrement;
