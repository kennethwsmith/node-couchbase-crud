var uuid=require('uuid');
var couchbase = require('couchbase');
var couchnode = require('couchnode');
var couchbaseConnected = false;

var responsecodes = require("./response_codes.json");

var objDocument = function(config){
	this.config = config;
	this.cluster=new couchbase.Cluster(config.couchbase_cluster_url);
	this.wrappedBucket=couchnode.wrap(this.cluster.openBucket(config.couchbase_bucket_name));
	this.tryOpenBucket();
	if(config.couchbase_view_name){
		this.view=config.couchbase_view_name;
	}
}


objDocument.prototype = {
	constructor: objDocument,

	tryOpenBucket:function(){
		this.bucket = this.cluster.openBucket(this.config.couchbase_bucket_name);
		this.bucket.on('error', function (err) {
        couchbaseConnected = false;
        console.log('CONNECT ERROR:', err);
    });
    this.bucket.on('connect', function () {
        couchbaseConnected = true;
        console.log('connected couchbase');
    });

	},
	upsertDocument:function(document_id, document_content, callback){
		if (couchbaseConnected == false){
			this.tryOpenBucket();
		}
		// validating inputs
		if(!document_content){
			return callback(responsecodes.inputdocumentempty);
		}
		var document_id=document_id || uuid.v4();
		try {
			document_content=JSON.stringify(document_content);
		} catch (e) {
			return callback(responsecodes.invalidjson);
		}
		//upserting data to couchbase
		this.bucket.upsert(document_id, document_content, function(err, result){
			if(err){
	            var responseObj=responsecodes.insertfailed;
	            responseObj.err=err;
	            return callback(responseObj);
			}
			var responseObj = responsecodes.insertsuccess;
			responseObj.document_id=document_id;
			return callback(responseObj);
		});
	},
	getDocument:function(document_id, callback){
		if (couchbaseConnected == false){
			this.tryOpenBucket();
		}
		if(document_id){
			this.bucket.get(document_id, function(err, result){
				if(err){
	                var responseObj=responsecodes.datafetchfailed;
	                responseObj.err=err;
					return callback(responseObj);
				}
	            if(Object.keys(result.value).length === 0){
	                return callback(responsecodes.responsesetempty);
	            }
				var responseObj = responsecodes.datafetchsuccess;
				responseObj.data=result.value;
				return callback(responseObj);
			});
		} else {
			if(this.view){
				var query = this.wrappedBucket
				.viewQuery('view', this.view)
				.reduce(false)
				.stale(this.wrappedBucket.viewQuery.Update.BEFORE);
				this.wrappedBucket.query(query, function (err, result, meta) {
					if (err) {
						var responseObj=responsecodes.datafetchfailed;
						responseObj.err=err;
						return callback(responseObj);
					} else {
						var responseObj = responsecodes.datafetchsuccess;
						responseObj.data=result;
						return callback(responseObj);
					}
				});
			} else {
				return callback(responsecodes.noviewfound);
			}
		}
	},
	deleteDocument:function(document_id, callback){
		if (couchbaseConnected == false){
			this.tryOpenBucket();
		}
		if(!document_id){
	        return callback(responsecodes.nodocumentid);
	    }
	    this.bucket.remove(document_id, function(err, cas, misses){
	        if(err){
	            var responseObj = responsecodes.datadeletionfailed;
	            responseObj.err=err;
	            return callback(responseObj);
	        }
	        return callback(responsecodes.datadeletionsuccess);
	    });
	}
}
module.exports = objDocument;
