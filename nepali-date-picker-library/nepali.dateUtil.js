
				$(document).ready(function(){
					$('body #Ez5zLH91IxC-cm9p7Cd7oZ6-val').nepaliDatePicker({
						npdMonth: true, npdYear: true,
						onChange: function(){
						 $('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').parent().parent().parent().parent().parent().parent().prev().find('.hasCalendarsPicker').val(BS2AD($('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').val()));
							$('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').parent().parent().parent().parent().parent().parent().prev().find('.hasCalendarsPicker').trigger('change');
							
							let val = $('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').val()
							$('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').parent().parent().parent().parent().parent().parent().prev().find('.hasCalendarsPicker').trigger('blur');
							$('.ui-datepicker-cmd-close').trigger("click");
							$('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').trigger("change");
							$('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').focus();
							console.log('date val', val);
							let year = val.substr(0,4);
							let  months =val.substr(5,2);
							let day = val.substr(8,2);
							try{

								var converter = new DateConverter();
								converter.setNepaliDate(year, months, day)
							     let convetedDate =converter.getEnglishYear()+"/"+converter.getEnglishMonth()+"/"+converter.getEnglishDate()
							
								// alert(converter.getEnglishYear()+"/"+converter.getEnglishMonth()+"/"+converter.getEnglishDate())
								console.log('date valooo', convetedDate);
								$('#Ez5zLH91IxC-cm9p7Cd7oZ6-val').val(convetedDate);
							//	converter.setCurrentDate()
							//	alert(converter.getNepaliYear()+"/"+converter.getNepaliMonth()+"/"+converter.getNepaliDate())
							//	alert( "Weekly day: "+ converter.getDay() )
							//	alert( converter.toNepaliString() )
						   
							}catch(err)
							{
								alert(err.message);
							}
							
						}
					});
				});