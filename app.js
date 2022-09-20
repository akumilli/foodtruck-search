var express = require("express");
const fs = require('fs');
const csv = require('csv-parser');
var moment = require('moment');
var _ = require('lodash');
var stringSimilarity = require("string-similarity");
var app = express();
app.set('port', process.env.PORT || 8000);

var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var allRecords = [];

var inputFilePath = './data.csv';

fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on('data', function (data) {
        try {
            allRecords.push(data);
        } catch (err) {}
    })
    .on('end', function () {});


app.post('/search', function (req, res) {

    var resSearch = {};
    resSearch.data = [];
    var param = req.body.param;
    var searchType = req.body.searchType;

    function checkFields() {
        return new Promise((resolve, reject) => {
            if (validateValue(param) == true) {
                resolve();
            } else {
                reject("Please Send the Search Parameter")
            }
        })
    }

    function searchData() {
        return new Promise((resolve, reject) => {
            var stringMatchThreshold = 0.10;
            for (var i = 0; i < allRecords.length; i++) {
                if (searchType == 'name') {
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["Applicant"].toUpperCase());
                } else if (searchType == 'address') {
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["Address"].toUpperCase());
                } else if (searchType == 'block') {
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["block"].toUpperCase());
                } else if (searchType == 'location') {
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["LocationDescription"].toUpperCase());
                } else if (searchType == 'fooditems') {
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["FoodItems"].toUpperCase());
                } else if (searchType == 'latitude') {
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["Latitude"].toUpperCase());
                } else if (searchType == 'longitude') {
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["Longitude"].toUpperCase());
                } else {
                    //Default Search is based on Name
                    var similarity = stringSimilarity.compareTwoStrings(param.toUpperCase(), allRecords[i]["Applicant"].toUpperCase());
                }
                if (similarity > stringMatchThreshold) {
                    allRecords[i].priority = similarity;
                    resSearch.data.push(allRecords[i]);
                }
            }
            resSearch.data = _.sortBy(resSearch.data, [function (o) {
                return parseInt(o.priority);
            }]);
            resolve();
        })
    }

    function sendResponse() {
        return new Promise((resolve, reject) => {
            resSearch.status = "success";
            res.json(resSearch);
            resolve();
        })
    }


    checkFields()
        .then(searchData)
        .then(sendResponse)
        .catch(err => {
            resSearch = {};
            resSearch.status = err
            res.json(resSearch);
        })
});


function validateValue(val) {
    if (!val || val == undefined || val == null || val == 'undefined' || val == 'null' || val == "" || val.length < 1 || val == NaN || val == 'NaN' || val == 'false' || val == false) {
        return (false);
    } else {
        return (true);
    }
}

app.listen(app.get('port'));