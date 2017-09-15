

function checkoutSetup() {
	var google_api_key = "AIzaSyA-WnIeOMDLZZ-BcNy4HIhjt7xTymOaf0w";

	var $checkoutButton = $('.checkout_button primary-button');

	$checkoutButton.on('click.checkout', function (e) {
		console.log('Checkout Button Clicked');
	});

	var url = window.location.href;
	if (url.indexOf(".com/checkout") != -1) {

	}
}

function setupAdjustSubscription() {

	var url = window.location.href;

	if (url.indexOf(".com/adjust_subscription") != -1) {
		$.get('/v1/store/api/subscriptions/', function (data) {
			var n = 0,
				activeSubscriptions = 0;
			for (result in data.results) {
				if (data.results.hasOwnProperty(result)) {
					if (data.results[n].status == 'active') {
						activeSubscriptions += 1;
					}
					n += 1;
				}
			}

			$('.adjust-subscription .sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(activeSubscriptions);
			$('.adjust-subscription .sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (activeSubscriptions * 15) + '.00');
			$('.activeSubs').text(activeSubscriptions);
			$('.activeSubsPrice').text('$' + (activeSubscriptions * 15) + '.00');
			if (activeSubscriptions == 0) {
				$('.catspot-product__incrementer--less').addClass('inactive');
			}
		});

		var allSubscriptions;
		$.get('/v1/store/api/subscriptions/', function (data) {
			allSubscriptions = data;
		});

		var purchaseButtons = $('.catspot-product__adjust');

		var working = false;

		purchaseButtons.on('click.purchase', function (e) {
			e.preventDefault();

			if (working) { return; }

			var self = this;

			console.log(allSubscriptions);

			var numBags = $('.catspot-product__number-bags').text();

			console.log('numBags: ', numBags);

			var n = 0,
				iframes = [],
				activeSubscriptions = 0,
				activeSubscriptionsArray = [],
				cancelledSubscriptions = 0,
				cancelledSubscriptionsArray = [],
				bagsToAdd = 0,
				bagsToAddRemaining = 0,
				bagsToReAdd = 0,
				bagsToSubtract = 0,
				endDayArray = [],
				staggeredSubs = false,
				todaysDay = new Date().getDay(),
				zeroSubscriptions = false;

			bagCounter = 0;

			for (result in allSubscriptions.results) {
				if (allSubscriptions.results.hasOwnProperty(result)) {
					if (allSubscriptions.results[n].status == 'active') {
						activeSubscriptions += 1;
						activeSubscriptionsArray.push(allSubscriptions.results[n]);
					}
					if (allSubscriptions.results[n].status == 'cancelled') {
						cancelledSubscriptions += 1;
						cancelledSubscriptionsArray.push(allSubscriptions.results[n]);
					}
					n += 1;
				}
			}

			console.log('active subs: ', activeSubscriptions);
			console.log('cancelled subs: ', cancelledSubscriptions);
			console.log('numBags: ', numBags);

			if (numBags > activeSubscriptions) {
				if (activeSubscriptions > 0) {
					console.log('ACTIVE SUBS');
					console.log(activeSubscriptionsArray);
					for (sub in activeSubscriptionsArray) {
						endDay = new Date(activeSubscriptionsArray[sub].end_date).getDay();
						console.log('In the loop');
						console.log(endDay);
						endDayArray.push(endDay);
					}
					for (day in endDayArray) {
						console.log('day');
						console.log(endDayArray[day]);
						console.log('---');
						console.log('todaysDay');
						console.log(todaysDay);
						if (endDayArray[day] != todaysDay) {
							staggeredSubs = true;
						}
					}
					if (staggeredSubs) {
						window.alert('We notice you just changed your subscription which will impact your product ship dates. You now have two options:\n\nFirst, if it is OK with you that your bags will NOT be shipped at the same time, do nothing further.\n\nIf you want your bags to be shipped at the SAME time, please call our customer service at 844-624-3125 and we will make that adjustment for you. Thank you!')
					};
				}
				bagsToAdd = numBags - activeSubscriptions;

				console.log('bagsToAdd:: ', bagsToAdd);

				Intercom('trackEvent', 'added-bags', { bagsAdded: bagsToAdd });

				if (cancelledSubscriptions > bagsToAdd) {
					bagsToReAdd = bagsToAdd;
				} else {
					bagsToReAdd = cancelledSubscriptions;
					bagsToAddRemaining = bagsToAdd - cancelledSubscriptions;
				}

				console.log('bagsToAddRemaining: ', bagsToAddRemaining);
				console.log('bagsToReAdd: ', bagsToReAdd);

				for (count = 0; count < bagsToReAdd; count++) {
					var reactivateURL = '/v1/store/api/subscriptions/' + cancelledSubscriptionsArray[count].id + '/reactivate/';
					$.ajax({
						url: reactivateURL,
						method: 'PUT',
						async: false,
						log_note: 'System Adjustment'
					})
				}
			}

			if (numBags < activeSubscriptions) {
				bagsToSubtract = activeSubscriptions - numBags;

				if (numBags == 0) {
					bagsToSubtract--;
					zeroSubscriptions = true;
				}

				console.log('bagsToSubtract: ', bagsToSubtract);

				Intercom('trackEvent', 'removed-bags', {
					bagsRemoved: bagsToSubtract,
					bagsRemaining: activeSubscriptions - cancelledSubscriptions
				});

				for (count = 0; count < bagsToSubtract; count++) {
					var cancelURL = '/v1/store/api/subscriptions/' + activeSubscriptionsArray[count].id + '/cancel/';
					$.ajax({
						url: cancelURL,
						method: 'PUT',
						cancel_reason: 10,
						async: false,
						log_note: 'System Adjustment'
					});
				}
			}

			if (bagsToAddRemaining > 0) {
				if (bagCounter == bagsToAddRemaining - 1) {
					working = false;
					window.location.href = '/subscribe/503608030_catspot-litter' + '?cache=' + (new Date).getTime();
				} else {
					for (var i = 0; i < bagsToAddRemaining - 1; i++) {

						var iframe = $('<iframe class="catspot-product__iframe" sandbox></iframe>');

						iframes.push(iframe);

						iframes[i].attr('src', '/subscribe/503608030_catspot-litter' + '?cache=' + (new Date).getTime());

						$('body').append(iframes[i]);

						iframes[i].on('load', function (e) {
							bagCounter++;
							console.log('Added bag to cart', bagCounter);

							if (bagCounter == bagsToAddRemaining - 1) {
								// Added bags
								//Intercom('trackEvent', 'added-subscriptions', {subscriptionsAdded: bagCounter});

								working = false;

								window.location.href = '/subscribe/503608030_catspot-litter' + '?cache=' + (new Date).getTime()
								  + '&message=These%20will%20be%20in%20addition%20to%20your%20current%20subscriptions.';
							}
						});

					}
				}
			} else if (zeroSubscriptions) {
				// Removed all subscriptions

				window.location.href = 'https://catspot.cratejoy.com/customer/cancel_subscription/' + activeSubscriptionsArray[activeSubscriptionsArray.length - 1].id;
			} else {
				// Removed some subscriptions
				//Intercom('trackEvent', 'removed-subscriptions', {subscriptionsRemoved: cancelledSubscriptions});
				window.location.href = 'https://catspot.cratejoy.com/customer/account';
			}
		});
	}
}

function setupPurchasing() {
	var purchaseButtons = $('.catspot-product__buy');
	var defaultProduct = purchaseButtons.first();

	var iframes = [];

	var working = false;

	purchaseButtons.on('click.purchase', function (e) {
		e.preventDefault();

		if (working) { return; }

		var self = this;

		var $el = $(e.target);
		var $parent = $el.closest('.catspot-product');
		var numBags = $parent.find('.catspot-product__number-bags').text();

		console.log('Purchase Button Clicked', defaultProduct);
		console.log('Purchasing Bags:', numBags);
		var bagCounter = 0;

		if (typeof defaultProduct != "undefined") {

			working = true;

			$el.text('Adding to Cart...');
			purchaseButtons.not($el).addClass('catspot-product__buy--disabled');

			if (bagCounter == numBags - 1) {
				working = false;
				window.location.href = defaultProduct.attr('href') + '?cache=' + (new Date).getTime();
			} else {
				for (var i = 0; i < numBags - 1; i++) {

					var iframe = $('<iframe class="catspot-product__iframe" sandbox></iframe>');

					iframes.push(iframe);

					iframes[i].attr('src', defaultProduct.attr('href') + '?cache=' + (new Date).getTime());

					$('body').append(iframes[i]);

					iframes[i].on('load', function (e) {
						bagCounter++;
						console.log('Added bag to cart', bagCounter);

						if (bagCounter == numBags - 1) {
							working = false;
							window.location.href = defaultProduct.attr('href') + '?cache=' + (new Date).getTime();
						}
					});

				}
			}
		}
	});
}

function hideNav() {
	var url = window.location.href;
	if (url.indexOf(".com/checkout") != -1 || url.indexOf(".com/create_account") != -1 || url.indexOf(".com/subscribe") > -1 || url.indexOf(".com/customer/thank_you") > -1) {

		$('body').addClass('hidenav');


		var stepsNav = '<nav class="stepsNav"><ul><li id="createAccount-Dot"><span>1</span></li><li id="choosePackage-Dot"><span>2</span></li><li id="checkout-Dot"><span>3</span></li><li id="confirmation-Dot"><span>4</span></li></ul></nav>',
			header = $('.navbar');

			$('#small-nav-wrapper').show();
      		$('.navbar-brand').addClass('resize-logo');

		header.append(stepsNav);
		if (url.indexOf(".com/checkout") != -1) {
			$('#checkout-Dot').addClass('active');
		}
		else if (url.indexOf(".com/create_account") != -1) {
			$('#createAccount-Dot').addClass('active');
		}
		else if (url.indexOf(".com/subscribe") > -1) {
			$('#choosePackage-Dot').addClass('active');
		}
		else if (url.indexOf(".com/customer/thank_you") > -1) {
			$('#confirmation-Dot').addClass('active');
		}
	}
}



function hideNav() {
	var url = window.location.href;
	if (url.indexOf(".com/checkout") != -1 || url.indexOf(".com/create_account") != -1 || url.indexOf(".com/subscribe") > -1 || url.indexOf(".com/customer/thank_you") > -1) {

		$('body').addClass('hidenav');


		var stepsNav = '<nav class="stepsNav"><ul><li id="createAccount-Dot"><span>1</span></li><li id="choosePackage-Dot"><span>2</span></li><li id="checkout-Dot"><span>3</span></li><li id="confirmation-Dot"><span>4</span></li></ul></nav>',
			header = $('.navbar');

			$('#small-nav-wrapper').show();
      		$('.navbar-brand').addClass('resize-logo');

		header.append(stepsNav);
		if (url.indexOf(".com/checkout") != -1) {
			$('#checkout-Dot').addClass('active');
		}
		else if (url.indexOf(".com/create_account") != -1) {
			$('#createAccount-Dot').addClass('active');
		}
		else if (url.indexOf(".com/subscribe") > -1) {
			$('#choosePackage-Dot').addClass('active');
		}
		else if (url.indexOf(".com/customer/thank_you") > -1) {
			$('#confirmation-Dot').addClass('active');
		}
	}
}




function toggleMenu() {
	$('.navbar-toggler').click(function () {
		$('#navigation').addClass('active');
	});

	$('.nav-close-button').click(function () {
		$('#navigation').removeClass('active');
	});

	$('#navigation a').click(function () {
		$('#navigation').hide();
		$('#navigation').removeClass('active');
		$('#navigation').attr('style', '');
	});
}

function swapButtons() {
	$('.swap-button').click(function () {
		if (!isMobileWidth()) {
			$('.swap-button').removeClass('active');
			$(this).addClass('active');
			$('#swap-section-wrapper').removeClass().addClass($(this).attr('data-section'));
		}
	})
}

function isMobileWidth() {
	return $('#index-hero > img').is(':visible');
}

function captureCredentials() {
	$('#create-account-button').click(function () {
		var createEmail = $('#create-account-email').val();
		var createPassword = $('#create-account-password').val();
		sessionStorage.setItem('email', createEmail);
		sessionStorage.setItem('pword', createPassword);
	})
}

function outputCredentials() {
	var url = window.location.href;
	if (url.indexOf(".com/checkout") != -1) {
		$('#email').val(sessionStorage.getItem('email'))
		$('#password').val(sessionStorage.getItem('pword'));
		sessionStorage.setItem('pword', '');
	}
}

function incrementorButtons() {
	$('.catspot-product__incrementer--less').click(function () {
		var url = window.location.href;
		var bagsNumber = $('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text();
		if (url.indexOf(".com/subscribe") != -1) {
			if (bagsNumber == 5) {
				bagsNumber = parseInt(bagsNumber, 10) - 1;
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
				$('.catspot-product__incrementer--less').addClass('inactive');

			}
			else if (bagsNumber == 15) {
				bagsNumber = parseInt(bagsNumber, 10) - 1;
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
				$('.catspot-product__incrementer--more').removeClass('inactive');
			}
			else if (bagsNumber > 5) {
				bagsNumber = parseInt(bagsNumber, 10) - 1;
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
			}
		} else if (url.indexOf(".com/adjust_subscription") != -1) {
			if (bagsNumber == 1) {
				bagsNumber = parseInt(bagsNumber, 10) - 1;
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
				$('.catspot-product__incrementer--less').addClass('inactive');

			}
			else if (bagsNumber == 15) {
				bagsNumber = parseInt(bagsNumber, 10) - 1;
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
				$('.catspot-product__incrementer--more').removeClass('inactive');
			}
			else if (bagsNumber > 1) {
				bagsNumber = parseInt(bagsNumber, 10) - 1;
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
				$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
			}
		}

	});

	$('.catspot-product__incrementer--more').click(function () {
		var bagsNumber = $('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text();
		if (bagsNumber <= 4) {
			bagsNumber = parseInt(bagsNumber, 10) + 1;
			$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
			$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
			$('.catspot-product__incrementer--less').removeClass('inactive');
		}
		else if (bagsNumber == 14) {
			bagsNumber = parseInt(bagsNumber, 10) + 1;
			$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
			$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
			$('.catspot-product__incrementer--more').addClass('inactive');
		}
		else if (bagsNumber < 15) {
			bagsNumber = parseInt(bagsNumber, 10) + 1;
			$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__number-bags').text(bagsNumber);
			$('.sf-grid__container:last-child .catspot-product__feature-definition.catspot-product__monthly-total p').text('$' + (bagsNumber * 15) + '.00');
		}
	});
}
function fitVidsInit() {
	$('#homepageVideos').fitVids();
}

function myAccountSetup() {
	var url = window.location.href;
	if (url.indexOf(".com/customer/account") != -1) {
		$('.showMore').click(function () {
			$('.leftRail .panel').toggleClass('active');
			if ($('.showMore').text() == 'Hide details') {
				$('.showMore').text('Show more details');
			}
			else {
				$('.showMore').text('Hide details');
			}
		});
		var activeSubscriptions = 0,
			cancelledSubscriptions = 0,
			unexpectedSubscriptions = 0,
			subscriptionStatus = $('.leftRail .panel-cratejoy:nth-of-type(2) .account-view-subscriptions .status');

		$.each(subscriptionStatus, function () {
			if ($(this).text() == 'active') {
				activeSubscriptions++;
			}
			else if ($(this).text() == 'cancelled') {
				cancelledSubscriptions++;
			}
			else {
				unexpectedSubscriptions++;
			}
		});
		$('#activeSubscriptions').text(activeSubscriptions);
		$('#activePrice').text('$' + (activeSubscriptions * 15) + '.00');
		$('#cancelledSubscriptions').text(cancelledSubscriptions);
		console.log(activeSubscriptions);
		if (activeSubscriptions == 0) {
			$('#editSubsBtn').text('Create a Subscription');
		}
		else {
			$('.one-bag-cta').attr('href', 'https://catspot.cratejoy.com/shop/product/726025695');
		}
	}

};
function homepageSetup() {
	var url = window.location.href;
	if (location.pathname == "/") {
		$('body').addClass('home');

		var allSubscriptions;

		$.get('/v1/store/api/subscriptions/', function (data) {
			allSubscriptions = data;
			var n = 0,
				hasSubscription = false;

			for (result in allSubscriptions.results) {
				if (allSubscriptions.results.hasOwnProperty(result)) {
					if (allSubscriptions.results[n].status == 'active') {
						hasSubscription = true;
					}
					n += 1;
				}
			}
			if (hasSubscription && $('.one-bag-cta a').length > 0) {
				var sburl = $('.one-bag-cta a').attr('href');
				sburl = sburl.replace('507928554', '726025695');
				$('.one-bag-cta a').attr('href', sburl);
			}
		}).fail(function () {
			console.log('No user is logged in');
		});
	}
};
function oneTimeSetup() {
	var url = window.location.href,
		packageInvite = '<p class="packageInvite">Or choose the <a href="http://www.catspotlitter.com/subscribe">Convenience Package</a> and save $3/bag with no risk!</p>',
		addToCart = $('#product-form .btn-primary');
	if (url.indexOf('507928554') != -1) {
		$.get('/v1/store/api/subscriptions/', function (data) {
			allSubscriptions = data;
			var n = 0,
				hasSubscription = false;

			for (result in allSubscriptions.results) {
				if (allSubscriptions.results.hasOwnProperty(result)) {
					if (allSubscriptions.results[n].status == 'active') {
						hasSubscription = true;
					}
					n += 1;
				}
			}
			if (hasSubscription) {
				url = url.replace('507928554', '726025695');
				window.location.href = url;
			}
		}).fail(function () {
			console.log('No user is logged in');
		  $('#product-form .btn-primary').before(packageInvite);
		});
	}
	if (url.indexOf('726025695') != -1) {
		$.get('/v1/store/api/subscriptions/', function (data) {
			allSubscriptions = data;
			var n = 0,
				hasSubscription = false;

			for (result in allSubscriptions.results) {
				if (allSubscriptions.results.hasOwnProperty(result)) {
					if (allSubscriptions.results[n].status == 'active') {
						hasSubscription = true;
					}
					n += 1;
				}
			}
			if (!hasSubscription) {
				$('button').attr('disabled', 'disabled');
				$('button').text('Special Pricing For Subscribers Only')
				url = url.replace('726025695', '507928554');
				window.location.href = url;
			}
		}).fail(function () {
			console.log('No user is logged in');
			$('button').attr('disabled', 'disabled');
			$('button').text('Special Pricing For Subscribers Only');
			url = url.replace('726025695', '507928554');
			window.location.href = url;
		});
	}
}


function smoothScroll() {
	$('a[href*="#"]').click(function() {
  	var hash = $(this).attr('href').split('/')[3].toString();
      console.log(hash);
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 1000, function(){
        window.location.hash = window.location.hash.split('?')[0]
      });
	});
}



$(document).ready(function () {
	$.getScript('https://s3.amazonaws.com/cratejoy_vendor_images/catspot/bold_mobile-copy-0/js/fitVids.js?ts=1478023102&host=www.catspotlitter.com', function () {
		$('.fitVidsWrapper').fitVids();
	});

	//FAQ Sidebar Navigation Active Links
	$('.side-bar-link').click(function() {
		$(this).addClass("active");
		$(this).parent().siblings().children().removeClass("active");
	});

	hideNav();
	swapButtons();
	toggleMenu();
	captureCredentials();
	outputCredentials();
	incrementorButtons();
	setupPurchasing();
	setupAdjustSubscription();
	checkoutSetup();
	myAccountSetup();
	homepageSetup();
	oneTimeSetup();
  smoothScroll();



});

// Intercom reporting
(function (window, document, undefined) {
	if (window.intercomSettings && window.intercomSettings.email) {
		var editSubBtn = $('.cj-edit-sub'),
			removeFromCartBtns = $('.rem_product_form .icon-remove-circle'),
			checkoutBtn = $('.checkout_button'),
			signUpBtns = $('[href="/create_account"]');

		// User intends to edit their subscription
		if (editSubBtn) {
			editSubBtn.on('click', function () {
				Intercom('trackEvent', 'clicked-edit-sub');
			});
		}

		if (removeFromCartBtns) {
			removeFromCartBtns.on('click', function () {
				Intercom('trackEvent', 'removed-item-from-cart', { item: $(this).parents('td.delete_column').next('.product_column').find('.product-name').text() });
			});
		}

		checkoutBtn.on('click', function () {
			Intercom('trackEvent', 'checkout', { total: $('.total_price').text() });
		});

		signUpBtns.on('click', function () {
			console.log('\nSIGN UP CLICK\n');
			//Intercom('trackEvent', 'clicked-sign-up');
		});

		//Intercom('trackEvent', 'page-view', {
		//  page: document.title
		//});
	}

})(this, this.document);
