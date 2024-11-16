$('#btnProcess').on('click', function() {
    const authCode = $('#authCode').val();
    const recaptchaResponse = grecaptcha.getResponse();

    // Cek apakah authCode dan CAPTCHA sudah diisi
    if (!authCode || !recaptchaResponse) {
        toastr.error("Please complete the CAPTCHA and provide the Auth Code.");
        return;
    }

    // Tampilkan modal reCAPTCHA jika belum selesai
    $('#recaptchaModal').modal('show');

    // Render reCAPTCHA di dalam modal
    grecaptcha.render('recaptcha-container', {
        'sitekey': '6LdeMoEqAAAAAEF85EPa4YnLvnw6weRb8p6uSQLt',  // Ganti dengan sitekey Anda
        'callback': function(response) {
            // Setelah CAPTCHA berhasil, kita bisa lanjutkan ke proses verifikasi
            $('#recaptchaModal').modal('hide'); // Tutup modal
            processForm(authCode, response);  // Kirim authCode dan recaptchaResponse ke server
        }
    });
});

// Proses pengiriman data ke server setelah CAPTCHA berhasil diverifikasi
function processForm(authCode, recaptchaResponse) {
    $('#loading').removeClass('d-none');

    $.ajax({
        type: 'POST',
        url: '/process',
        data: JSON.stringify({
            authCode: authCode,
            recaptchaResponse: recaptchaResponse
        }),
        contentType: 'application/json',
        success: function(response) {
            $('#loading').addClass('d-none');
            if (response.success) {
                $('#result').html(`<div class="alert alert-success">${response.message}</div>`);
                toastr.success(response.message);
            } else {
                $('#result').html(`<div class="alert alert-danger">${response.message}</div>`);
                toastr.error(response.message);
            }
        },
        error: function() {
            $('#loading').addClass('d-none');
            toastr.error("An error occurred while processing your request.");
        }
    });
}
