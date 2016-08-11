# node-couchbase-crud
Lightweight node client for Couchbase CRUD operations


EXAMPLE CODE USAGE OF METHODS INSERT(POST), UPDATE(PUT), SELECT(GET), DELETE(DELETE)

    var express=require('express');
    var app = express();
    var apiRoute = express.Router();
    
    var bodyParser = require('body-parser');
    
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", 'POST, GET, PUT, DELETE, OPTIONS');
      next();
    });
    
    //NODE COUCHBASE CRUD MODULE REQUIRED
    var couchbaseConnector = require('node-couchbase-crud');
    
    //TEST CONFIG JSON OBJECT
    var config = {
        "couchbase_cluster_url":"couchbase://TEST URL",
        "couchbase_bucket_name":"BUCKET_NAME",
        "couchbase_view_name":"ALL_BUCKET_DATA_VIEW_NAME"
    }
    //CALLING CONSTRUCTOR WITH CONFIGURATION DETAILS
    var couchRequest = new couchbaseConnector(config);
    
    
    /* FOR GETTING ALL DOCUMENTS, YOU'LL NEED TO CREATE A PUBLISHED PRODUCTION VIEW AND PASS THE NAME IN 
    CONFIG COUCHBASE_VIEW_NAME, VIEW FUNCTION BELOW
    
        function (doc, meta) {
            emit(meta.id, doc);
        }
    */
    apiRoute.get("/allDocuments", function(req, res){
        //get all documents
        couchRequest.getDocument(null, function(result){
            return res.json(result);
        });
    });
    
    //INSERTING NEW DOCUMENT
    apiRoute.post("/document", function(req, res){
        couchRequest.upsertDocument(null, req.body.document_body,function(result){
            return res.json(result);
        });
    });
    
    //UPDATING EXISTING DOCUMENT
    apiRoute.put("/document", function(req, res){
        couchRequest.upsertDocument(req.body.document_id, req.body.document_body,function(result){
            return res.json(result);
        });
    });
    //GET DOCUMENT BY ID AND GETTING ALL DOCUMENTS.
    apiRoute.get("/document", function(req, res){
        //get document by id
        if(req.query.document_id){
            couchRequest.getDocument(req.query.document_id, function(result){
                return res.json(result);
            });
        }
        //getting all documents
        couchRequest.getDocument(null, function(result){
            return res.json(result);
        });
    
    });
    
    //DELETING DOCUMENT BY ID
    apiRoute.delete("/document", function(req,res){
        //delete document by ID
        couchRequest.deleteDocument(req.query.document_id, function(result){
            return res.json(result);
        });
    });
    
    var port = process.env.port || 8080;
    app.use("/", apiRoute);
    app.listen(port);
    console.log("Server started at port :: "+port);
