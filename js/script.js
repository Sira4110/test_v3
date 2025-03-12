$(document).ready(function(){
	$('.header_burger').click(function(event){
		$('.header_burger, .menu').toggleClass('active');
		$('body').toggleClass('lock');
	});

	$('.menu_link').click(function(event){
		$('.header_burger, .menu').removeClass('active');
		$('body').removeClass('lock');
	});
});

const sr = ScrollReveal({
	origin: 'top',
	distance: '50px',
	duration: 2000,
	depay: 400,
	reset: true
});

sr.reveal(`.home_subtitle`, {origin: 'top'})
sr.reveal(`.home_title`, {origin: 'left'})
sr.reveal(`.home_descr`, {origin: 'right'})
sr.reveal(`.home_text`, {origin: 'top'})
sr.reveal(`.home_button`, {origin: 'bottom'})

document.getElementById('copy-email').addEventListener('click', function(e) {
    e.preventDefault();

    const emailText = 'cryptomonocle@gmail.com';
    const input = document.createElement('input');
    input.value = emailText;
    document.body.appendChild(input);

    input.select();
    document.execCommand('copy');

    document.body.removeChild(input);

    const message = document.createElement('div');
    message.id = 'copy-message';
    message.textContent = `${emailText} was copied to the clipboard`;
    document.body.appendChild(message);

    setTimeout(function() {
        message.style.visibility = 'visible';
        message.style.opacity = 1;
    }, 10);

    setTimeout(function() {
        message.style.opacity = 0;
        setTimeout(function() {
            message.style.visibility = 'hidden';
        }, 300);
    }, 3000);
});

