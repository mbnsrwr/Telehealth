'use strict';
var apiUrl = location.protocol + '//' + location.host;

console.log(apiUrl);
$("#checkform1").validator();
//check user input and call server to create dataset
$('#checkform1').on("submit", function(e) {
    if(!e.isDefaultPrevented()){
        e.preventDefault();
    
    //get user input data
    var AccountNum =  $('#email').val();
    var CardId = $('#card-id').val();
    var FirstName = $('#fName').val();
    var LastName = $('#lName').val();
    var gender = $('#gender').val();
    var exp = $('#exp').val();
    var dob = $('#dob').val();
    var specl = $('#specl').val();

    //create json data
    var inputData = '{' + '"firstname" : "' + FirstName + '", ' + '"lastname" : "' + LastName + '", ' + '"gender" : "' + gender + '", ' + '"dob" : "' + dob + '", ' + '"exp" : "' + exp + '", ' + '"specl" : "' + specl + '", ' + '"accountnumber" : "' + AccountNum + '", ' + '"cardid" : "' + CardId + '"}';
    console.log(inputData);
    //make ajax call to add the dataset
    $.ajax({
        type: 'POST',
        url: apiUrl + '/doctor/registerDoctor',
        data: inputData,
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function () {
            //display loading
            document.getElementById('main').style.display = "none";
            document.getElementById('preloader').style.display = "block";
            $("#preloader").children().css({"display": "block"});
        },

        success: function (data) {

            //remove loader
            document.getElementById('main').style.display = "block";
            document.getElementById('preloader').style.display = "none";
            $("#preloader").children().css({"display": "none"});

            //check data for error
            if (data.error) {
                document.getElementById('page').style.display = "block";
                alert(data.error);
                return;
            } else {
                //notify successful registration
                alert("Registration Succesfull");
                
            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
           //reload on error
            alert("Error: Try again")
            console.log(errorThrown);
            console.log(textStatus);
            console.log(jqXHR);
        }
    });
}
});

//check user input and call server to create dataset
$('#checkform').on("submit", function(e) {
    if(!e.isDefaultPrevented()){
        e.preventDefault();
                //get user input data
                var AccountNum =  $('#email').val();
                var CardId = $('#card-id').val();
                var FirstName = $('#fName').val();
                var LastName = $('#lName').val();
                var gender = $('#gender').val();
                var dob = $('#dob').val();

                //create json data
                var inputData = '{' + '"firstname" : "' + FirstName + '", ' + '"lastname" : "' + LastName + '", ' + '"gender" : "' + gender + '", ' + '"dob" : "' + dob + '", ' + '"accountnumber" : "' + AccountNum + '", ' + '"cardid" : "' + CardId + '"}';
                console.log(inputData);
                //make ajax call to add the dataset
                $.ajax({
                    type: 'POST',
                    url: apiUrl + '/patient/registerPatient',
                    data: inputData,
                    dataType: 'json',
                    contentType: 'application/json',
                    beforeSend: function () {
                       //display loading
                        document.getElementById('main').style.display = "none";
                        document.getElementById('preloader').style.display = "block";
                        $("#preloader").children().css({"display": "block"});    
                    },

                    success: function (data) {

                          //remove loader
                        document.getElementById('main').style.display = "block";
                        document.getElementById('preloader').style.display = "none";
                        $("#preloader").children().css({"display": "none"});

                        //check data for error
                        if (data.error) {
                            document.getElementById('page').style.display = "block";
                            alert(data.error);
                            return;
                        } else {
                            //notify successful registration
                            alert("Registration Succesfull");
                        }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                    //reload on error
                        alert("Error: Try again")
                        console.log(errorThrown);
                        console.log(textStatus);
                        console.log(jqXHR);
                    }
                });

    
}
});
