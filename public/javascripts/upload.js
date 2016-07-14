// var clientId = 'YOUR CLIENT ID';
// var apiKey = 'YOUR API KEY';
// var scopes = 'https://www.googleapis.com/auth/drive.file';
// var signinButton = document.getElementById('signin-button');
// var signoutButton = document.getElementById('signout-button');
//
// function initAuth() {
//   gapi.client.setApiKey(apiKey);
//   gapi.auth2.init({
//       client_id: clientId,
//       scope: scopes
//   }).then(function () {
//     // Listen for sign-in state changes.
//     gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
//
//     // Handle the initial sign-in state.
//     updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
//
//     signinButton.addEventListener("click", handleSigninClick);
//     signoutButton.addEventListener("click", handleSignoutClick);
//   });
// }
//
// function updateSigninStatus(isSignedIn) {
//   if (isSignedIn) {
//     signinButton.style.display = 'none';
//     signoutButton.style.display = 'block';
//     makeApiCall();
//   } else {
//     signinButton.style.display = 'block';
//     signoutButton.style.display = 'none';
//   }
// }
//
// function handleSigninClick(event) {
//   gapi.auth2.getAuthInstance().signIn();
// }
//
// function handleSignoutClick(event) {
//   gapi.auth2.getAuthInstance().signOut();
// }

// // Load the API client and auth library
// gapi.load('client:auth2', initAuth);

$('.upload-btn').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

$('#upload-input').on('change', function(){

  var files = $(this).get(0).files;

  if (files.length > 0){
    // create a FormData object which will be sent as the data payload in the
    // AJAX request
    var formData = new FormData();

    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);
    }

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
          console.log('upload successful!\n' + data);
      },
      xhr: function() {
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // listen to the 'progress' event
        xhr.upload.addEventListener('progress', function(evt) {

          if (evt.lengthComputable) {
            // calculate the percentage of upload completed
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);

            // update the Bootstrap progress bar with the new percentage
            $('.progress-bar').text(percentComplete + '%');
            $('.progress-bar').width(percentComplete + '%');

            // once the upload reaches 100%, set the progress bar text to done
            if (percentComplete === 100) {
              $('.progress-bar').html('Done');
            }

          }

        }, false);

        return xhr;
      }
    });

  }
});
