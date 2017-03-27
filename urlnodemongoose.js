var express = require('express');
var http = require('http');
var app = express();

var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})
); 

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/jobstest6');
var db = mongoose.connection;
db.on('error', function(err) {
	console.log('connection error', err);
});
db.once('open', function() {
	console.log('connected to mongodb');
})

var Schema = mongoose.Schema;
var urlSchema = new Schema({
	jobId : String,
    url: String,
    html : String,
});
var Url = mongoose.model('Url', urlSchema);

function Queue() {
  this.queue = [];
}
Queue.prototype.enqueue = function(value) {
  this.queue.push(value);
};
Queue.prototype.dequeue = function() {
  this.queue.shift();
};
Queue.prototype.peek = function() {
  return this.queue[0];
};
Queue.prototype.getElement = function(pos) {
	return this.queue[pos];
};
Queue.prototype.length = function() {
  return this.queue.length;
};
Queue.prototype.print = function() {
  console.log(this.queue.join(','));
};


var queue = new Queue(); 

var router = express.Router();
router.get('/home', function(req, res) {
	console.log("in usershome page");
	res.sendfile('index.html');
});

router.route('/jobstatus')
	.get(function(req, res) {
			console.log("in timer function - get success jobs ");
			Url.find({},{}, function(err, docs) {
				console.log('the url list: ' + docs);
				res.send(docs);
			});
		})

router.route('/urljobs')
	.get(function(req, res) {
		console.log("checking job status, jobId=", req.query.jobId);
		for(var i=0; i<queue.length(); i++) {
			console.log("entered for loop",i);
			if(queue.getElement(i).id == req.query.jobId)
			{
				var status = queue.getElement(i).status;
				console.log("success status retrival of job", status);
				res.send(status);
			}
		}
	})

	.post(function(req, res) {
		console.log("start processing url = " + req.body.url);
		console.log(req.body);
		if(req.body.url)
		{
			console.log("entered if");
			var jobId = createUUID();
			var url = req.body.url;
			var urlObj = {
				id: jobId, 
				status: "waiting", 
				url: url
			};
			console.log("adding job to queue, job=", urlObj);
			res.send(jobId);
			queue.enqueue(urlObj);
			console.log("queue is=", queue);		
		}
	});

function queuefunc() {
	if(queue.length() > 0) {
		queue.getElement(0).status = "processing" ;
		var urlObj = queue.peek();
		queue.dequeue();
		console.log("the elements in queue are :", queue);
		console.log("length of the queue is ", queue.length());
		console.log("peek data is", urlObj);
		httpGet(urlObj);
	}
};

function httpGet(urlObj)
{
    var options = {
	  host: urlObj.url,
	};
	var stringhtml = '';
	http.get(options, function(res) {
	  console.log("Got response for the html data text: status ", res.statusCode);
		res.setEncoding('utf8');
		res.on('data', function (html) {
			//console.log('BODY: ' + html);
			stringhtml = stringhtml + html;
		}); 
		res.on('end', function() {
			console.log("html body all rendered");
			console.log(stringhtml);
			addtoDB(stringhtml, urlObj);
		})
	}).on('error', function(e) {
	  console.log("Got error: " + e.message);
	});
}

function addtoDB(htmldata, urlObj) {
	var url = new Url();
	url.url = urlObj.url;
	url.jobId = urlObj.id;
	url.html = htmldata;
	url.save(function(err) {
		if(err) {
			console.log("error while trying to add to database",err);
		} else {
			console.log("success adding to mongodb");
		}
	});
};

function createUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
}

app.use('/', router);
app.listen(8081);

setInterval(queuefunc, 50000);
