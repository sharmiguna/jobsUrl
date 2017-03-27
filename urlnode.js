var express = require('express');
var app = express();
var mysql = require('mysql');


function Queue() {
  this.queue = [];
}

Queue.prototype.enqueue = function(value) {
  this.queue.push(value);
};
Queue.prototype.dequeue = function() {
  return this.queue.shift();
};
Queue.prototype.peek = function() {
  return this.queue[0];
};
Queue.prototype.length = function() {
  return this.queue.length;
};
Queue.prototype.print = function() {
  console.log(this.queue.join(' '));
};

var queue = new Queue(); 


var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})
); 


var urlobj = {jobID:" ", jobStatus:""};


var router = express.Router();

router.get('/home', function(req, res) {
	console.log("in home page");
	res.sendfile('index.html');
});


router.route('/urljobs/:xyz')
	.get(function(req, res) {
		console.log("in getting job status - get ");
			if (req.params.xyz) {
				console.log("getting status for JobID " + req.params.xyz);
			} else {
				console.log("error");
			}
			
		}),

	.post(function(req, res) {
		console.log("entered --- adding the url to database");
		var query = "insert into urljobs(jobID, htmldata) values(" + jobID+","+htmldata+");" ; 
		connection.query(query, function(err, rows, fields) {
			    if (err)  {
			    	console.log(err);
			    	res.send(err);
				} else {
					// console.log(rows);
					res.send(rows);
				}
			});		
	});


app.use('/', router);
app.listen(8081);


