$(document).ready(function() {
    // Ketika tombol Proses diklik
    $('#btnProcess').click(function() {
        const authCode = $('#authCode').val();  // Ambil auth code dari input
        const recaptchaResponse = grecaptcha.getResponse(); // Ambil response token reCAPTCHA
        
        // Validasi jika reCAPTCHA belum diselesaikan
        if (!recaptchaResponse) {
            toastr.error("Please complete the reCAPTCHA.");
            return;
        }
        
        // Validasi auth code (pastikan ada isinya)
        if (!authCode) {
            toastr.error("Please enter your Auth Code.");
            return;
        }
        
        // Tampilkan loading spinner
        $('#loading').removeClass('d-none');
        $('#result').html(''); // Clear previous result

        // Kirimkan Auth Code dan token reCAPTCHA ke backend
        $.ajax({
            url: '/process',  // Endpoint backend untuk memproses
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                authCode: authCode,
                recaptchaResponse: recaptchaResponse
            }),
            success: function(response) {
                // Sembunyikan spinner loading
                $('#loading').addClass('d-none');

                // Menampilkan pesan sukses atau error
                if (response.success) {
                    toastr.success(response.message); // Notifikasi sukses
                    $('#result').html(`<div class="alert alert-success">${response.message}</div>`);
                } else {
                    toastr.error(response.message); // Notifikasi error
                    $('#result').html(`<div class="alert alert-danger">${response.message}</div>`);
                }
            },
            error: function(xhr, status, error) {
                // Sembunyikan spinner loading jika ada error
                $('#loading').addClass('d-none');
                toastr.error("There was an error processing your request.");
            }
        });
    });
});
