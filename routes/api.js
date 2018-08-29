/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const https = require('https');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app, db) {
  
  var gsiData = [];
  var likeStatus = 0;
  var likeCount = [];
  var toDisplay = [];
  var maxLikes;
  var minLikes;
  var rel_likes = [];


  app.route('/api/stock-prices')
    .get(function (req, res){
      req.query.like == "true" ? likeStatus = 1: likeStatus = 0;
    
    if (req.query.stock instanceof Array == true) {
      req.query.stock.map((x) => {
        https.get("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" + x + "&apikey=" +process.env.ALPHAVANTAGE_APIKEY, (response) => {
            let data = '';

            response.on('data', (d) => {
              data += d;
            });

            response.on('end', () => {
              gsiData.push(JSON.parse(data)['Global Quote']);
              if (gsiData.length == 2) {
                storeData(gsiData, "array", res);
                gsiData = [];
              }
            });

          }).on('error', (e) => {
            console.log('getStockInfo error: ');
            console.error(e);
          });
      });
    } else {
      https.get("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" + req.query.stock + "&apikey=" +process.env.ALPHAVANTAGE_APIKEY, (response) => {
            let data = '';

            response.on('data', (d) => {
              data += d;
            });

            response.on('end', () => {
              gsiData.push(JSON.parse(data)['Global Quote']);
              storeData(gsiData, "string", res);
              gsiData = [];
            });

          }).on('error', (e) => {
            console.log('getStockInfo error: ');
            console.error(e);
          });
    }
    
    });
    
    function storeData(data, type, res) {
      if (type == "array") {
          data.forEach(function (ele, x) {
           db.collection('stocks').findOneAndUpdate({stock: ele['01. symbol']}, {$set: {stock: ele['01. symbol'], price: ele['05. price']}, $inc: { likes: likeStatus }}, {returnOriginal: false, upsert: true}, function (err, stocks) {            // Needs to replace with method that finds stock but if not present inserts it in database
              if(err) {
                console.log('Find method returns error: ' +err);
                res.send('Find method returns error: ' +err);
              } else {
                
                if (likeCount.length > 2)
                  likeCount = [];
                likeCount.push(stocks.value.likes);
                
                maxLikes = Math.max(...likeCount);
                minLikes = Math.min(...likeCount);
                rel_likes = [];
                
                if (likeCount.length == 2) {
                  likeCount[0] == maxLikes ? (rel_likes[0] = maxLikes - minLikes, rel_likes[1] = minLikes - maxLikes) : (rel_likes[0] = minLikes - maxLikes, rel_likes[1] = maxLikes - minLikes);
                  // console.log(rel_likes);
                }
                
                likeStatus = 0;
                
                if (toDisplay.length > 2)
                  toDisplay = [];
                toDisplay.push({stock: stocks.value.stock, price: stocks.value.price})
                
                if (rel_likes.length == 2) {
                  rel_likes.forEach((x, index) => {
                    toDisplay[index].rel_likes = x;
                  });
                }
                
                
                if (toDisplay.length == 2) {
                  res.json({stockData: toDisplay});
                }
                
              }
            });
         });
      } else {
        data.forEach(function (ele, x) {
           db.collection('stocks').findOneAndUpdate({stock: ele['01. symbol']}, {$set: {stock: ele['01. symbol'], price: ele['05. price']}, $inc: { likes: likeStatus }}, {returnOriginal: false, upsert: true}, function (err, stocks) {            // Needs to replace with method that finds stock but if not present inserts it in database
              if(err) {
                console.log('Find method returns error: ' +err);
                res.send('Find method returns error: ' +err);
              } else {
                if (likeCount.length > 1)
                  likeCount = [];
                likeCount.push(stocks.value.likes);
                likeStatus = 0;
                
                if (toDisplay.length > 1)
                  toDisplay = [];
                toDisplay.push({stock: stocks.value.stock, price: stocks.value.price, likes: stocks.value.likes})
                
                if (toDisplay.length == 1) {
                  res.json({stockData: toDisplay[0]});
                }
              }
            });
         });
      }
    }
};
