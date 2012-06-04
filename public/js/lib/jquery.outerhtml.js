jQuery.fn.outerHtml = function()
{
	return jQuery('<div></div>').append( this.clone() ).html();
};