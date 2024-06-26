const mongoose = require("mongoose");

const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");

exports.multiplePopulate = (query, populateOptions) => {
    if (Array.isArray(populateOptions)) {
        populateOptions.forEach((option) => {
            query = query.populate(option);
        });
    } else {
        query = query.populate(populateOptions);
    }
    return query;
};
exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndDelete(req.params.id);

        if (!document) {
            next(
                new AppError(`No document find with id ${req.params.id}`, 404)
            );
        }

        res.status(204).json({
            status: "succeess",
            data: null,
        });
    });

exports.updateOne = (Model) =>
    (updateTour = catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            status: "succeess",
            data: { data: document },
        });
    }));

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const document = await Model.create(req.body);

        res.status(201).json({
            status: "success",
            data: document,
        });
    });

exports.getOne = (Model, populateOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id).select("-__v");
        if (populateOptions)
            query = this.multiplePopulate(query, populateOptions);
        const document = await query;
        if (!document) {
            next(
                new AppError(`No document find with id ${req.params.id}`, 404)
            );
            return;
        }
        res.json({
            status: "success",
            data: {
                data: document,
            },
        });
    });

exports.getAll = (Model, populateOptions, where) =>
    catchAsync(async (req, res, next) => {
        const course = req.params.courseId;
        let query = Model.find();
        if (populateOptions) {
            query = this.multiplePopulate(query, populateOptions);
        }
        if (course)
            query = query
                .where("course")
                .equals(mongoose.Types.ObjectId(course));

        const document = await query;
        res.json({
            status: "success",
            results: document.length,
            data: {
                data: document,
            },
        });
    });
