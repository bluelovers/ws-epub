import Handlebars from 'handlebars';

export const mimetypes = {
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'bmp': 'image/bmp',
	'png': 'image/png',
	'svg': 'image/svg+xml',
	'gif': 'image/gif'
};

Handlebars.registerHelper('extension', function (str)
{
	return ext(str);
});

Handlebars.registerHelper('mimetype', function (str)
{
	return mimetypes[ext(str)];
});

function ext(str)
{
	return str.substr(str.lastIndexOf('.') + 1);
}

export { Handlebars };

export default Handlebars;
