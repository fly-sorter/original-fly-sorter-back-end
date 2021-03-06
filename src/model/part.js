'use strict';

const mongoose = require('mongoose');
const HttpError = require('http-errors');
const SubAssembly = require('./sub-assembly');

const partSchema = mongoose.Schema({
  partId: {
    type: Number,
    unique: true,
    required: true,
    min: [100000, 'Id must be a unique integer starting from 100000'],
  },
  partDescription: {
    type: String,
  },
  partSub: {
    type: Boolean,
    required: true,
  },
  partSrc: {
    type: String,
    required: true,
  },
  partMfgNum: {
    type: String,
  },
  partPrice: {
    type: String,
    required: true,
  },
  partCategory: {
    type: String,
    required: true,
  },
  partLocation: {
    type: String,
    required: true,
  },
  partCount: {
    type: String,
  },
  partLongLead: {
    type: Boolean,
  },
  partNotes: {
    type: String,
  },
  // BEN: This is for listing out associated parts on a sub assy.
  //        Mongoose still links behind the scenes, but this is for
  //        the customer.
  subIDRef: {
    type: String,
    required: true,
  },
  // TOM: This connects the parts to the subAssembly
  subAssembly: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'subAssembly',
  },
});

function partPreHook(done) {
  return SubAssembly.findById(this.subAssembly)
    .then((subAssemblyFound) => {
      if (!subAssemblyFound) {
        throw new HttpError(404, 'No existing subAssembly');
      }
      subAssemblyFound.parts.push(this._id);
      return subAssemblyFound.save();
    })
    .then(() => done())
    .catch(error => done(error));
}

const partPostHook = (document, done) => {
  return SubAssembly.findById(document.subAssembly)
    .then((subAssemblyFound) => {
      if (!subAssemblyFound) {
        throw new HttpError(500, 'subAssembly not found');
      }
      subAssemblyFound.parts = subAssemblyFound.parts.filter((part) => {
        return part._id.toString() !== document._id.toString();
      });
      return subAssemblyFound.save();
    })
    .then(() => done())
    .catch(done);
};

partSchema.pre('save', partPreHook);
partSchema.post('remove', partPostHook);

module.exports = mongoose.model('part', partSchema);
