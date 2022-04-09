import { WebApp } from 'meteor/webapp';
WebApp.connectHandlers.use('/upload_files', function (req, res) {
    console.log(req)
    // const file = req.file
    //do something with the file
});