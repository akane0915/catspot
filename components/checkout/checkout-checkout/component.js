<script src="//d79i1fxsrar4t.cloudfront.net/jquery.liveaddress/3.2/jquery.liveaddress.min.js"></script>
<script>
	function defer(method) {
		if (window.jQuery) {
			method();
		} else {
			setTimeout(function () { defer(method) }, 50);
		}
	}

defer(function () {
	console.log('update');
	console.log('update');
	console.log('update');

		// Append replacement Checkout Button
		$('#checkout_form .cta').append('<div class="checkoutButtonStandin">Checkout</div>');
		$('.checkoutButtonStandin').click(function (){
				$('#checkout_button')[0].click();

		});
		// Remove Button Update
		var productRows = $('.item_table tr')
		$.each(productRows, function () {
			$(this).find('.price_column').append($(this).find('form'))
		});

		// Append disclaimer text
		$('.ship_to.form_holder').append('<div class="disclaimerText"><span>If you use a PO Box, it must be used as your shipping address.</span> Only available for the 48 contiguous states.</div>');
		var register = $('.register'),
			cta = $('.cta'),
			couponSection = $('.coupon_section');

		//register.insertAfter(couponSection);
		//cta.insertAfter(register);

		var liveAddress = $.LiveAddress({
			key: '26280772083855436',
			debug: false,
			target: 'US',
			autocomplete: 5,
			autoVerify: true,
			verifySecondary: true,
			addresses: [{
				id: 'shipping',		// IDs are not part of the address
				address1: '#street',
				address2: '#unit',
				locality: '#city',
				administrative_area: '#state',
				postal_code: '#zip_code',
				country: '#country'
			}]
		})

		liveAddress.on("AddressWasInvalid", function (event, data, previousHandler) {
			console.log('Address was invalid.');
			previousHandler(event, data);
		});

		liveAddress.on("AddressWasValid", function (event, data, previousHandler) {
			console.log('Address was valid.');
			previousHandler(event, data);
		});

		liveAddress.on("AddressAccepted", function (event, data, previousHandler) {
          	console.log('Address was accepted 1');
			//if(data.response.chosen.analysis.dpv_footnotes == 'AACC'){
			//$('body').append('<div class="overlay"><div class="smarty-ui"><div class="smarty-popup smarty-addr-shipping" style="width: 300px; height: 230px;"><div class="smarty-popup-header">Attention: Your address has been confirmed address by dropping secondary (apartment, suite, etc.) information. Please verify that the secondary information is correct as it could delay or prevent your delivery.</div><hr style="margin-bottom: 15px;"><div class="smarty-choice-alt"><a href="javascript:" class="smarty-choice smarty-choice-abort smarty-abort">Go back</a><a href="javascript:" class="smarty-choice smarty-choice-override">Use as it is</a></div></div></div></div>');
			//}
			if (data.response.isMissingSecondary()) {
              console.log('Address was accepted 2');
				data.address.abort(event, false);
				alert("Don't forget your apartment number!");
				previousHandler(event, data);
			} else if (data.response.chosen.analysis.dpv_footnotes == 'AACC') {
              console.log('Address was accepted 3');
				data.address.abort(event, false);
				alert("Your Apartment/Suite Number is invalid. Please update it and click the Verify checkmark button next to the city field. If you continue to have issues, please call customer support at 1-844-624-3125");
				previousHandler(event, data);
			} else if (data.response.chosen.analysis.dpv_footnotes == 'AABB') {
              console.log('Address was accepted 4');
				$('#checkout_button')[0].click();
				previousHandler(event, data);
			}
			else{
              console.log('Address was accepted 5');
				$('#checkout_button')[0].click();
				previousHandler(event, data);
			}
		});


		(function (window, document, undefined) {

			// Remove States
			setTimeout(function () {
				//console.log('REMOVING STATES!');
				var dictionary = ['AK', 'AS', 'AA', 'AE', 'AP', 'FM', 'GU', 'HI', 'MH', 'MP', 'PW', 'PR', 'VI'], // Values of option items we need to remove
					dictionaryCount = dictionary.length,
					stateSelectBox = document.querySelector('#state');
				while (dictionaryCount--) {
					var item = stateSelectBox.querySelector('[value="' + dictionary[dictionaryCount] + '"]');
					item.parentNode.removeChild(item);
				}
			}, 1000);
		})(this, this.document);
	});
</script>
