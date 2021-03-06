//If you see good code in here, it was probably the original guy. Anything that makes you shake your head was probably me 

//TODO Adding an extra Guard deck will reshuffle the first one, End of round with multiple Archers, resize text, worth to show common and elite_only attributes?, shield and retaliate only when shown (apparently, attribtues are active at the beginning of the turn, and active after initiative)
var do_shuffles = true;
var visible_ability_decks = [];
var modifier_deck = null;
var deck_definitions = load_definition(DECK_DEFINITONS);

var DECK_TYPES = {
	
	ABILITY: "ability",
	BOSS: "boss"
};
	
var EVENT_NAMES = {
	MODIFIER_CARD_DRAWN: "modifierCardDrawn",
	MODIFIER_DECK_SHUFFLE_REQUIRED: "modfierDeckShuffleRequired"
};

function UICard(front_element, back_element) {
	var card = {};

	card.back = back_element;
	card.front = front_element;

	card.flip_up = function(faceup) {
		toggle_class(this.back, "up", !faceup);
		toggle_class(this.back, "down", faceup);

		toggle_class(this.front, "up", faceup);
		toggle_class(this.front, "down", !faceup);
	};

	card.set_depth = function(z) {
		this.back.style.zIndex = z;
		this.front.style.zIndex = z;
	}

	card.push_down = function() {
		this.back.style.zIndex -= 1;
		this.front.style.zIndex -= 1;
	}

	card.addClass = function(class_name) {
		this.front.classList.add(class_name);
		this.back.classList.add(class_name);
	}

	card.removeClass = function(class_name) {
		this.front.classList.remove(class_name);
		this.back.classList.remove(class_name);
	}

	card.attach = function(parent) {
		parent.appendChild(this.back);
		parent.appendChild(this.front);
	}

	card.flip_up(false);

	return card;
}

function create_ability_card_back(name, level) {
	var card = document.createElement("div");
	card.className = "card ability back down";

	var name_span = document.createElement("span");
	name_span.className = "name";


	name_span.innerText = name;

	card.appendChild(name_span);
	return card;
}

function create_ability_card_front(initiative, name, shuffle, lines, attack, move, range, level, health) {

	var card = document.createElement("div");
	card.className = "card ability front down";

	var name_span = document.createElement("span");
	name_span.className = "name";

	if (name.substring(0, 2) == "PC") {
		shortname = name.substring(3, name.length)
		shortname = shortname.replace(/_/g, " ");		
		name_span.innerHTML = '<img src="images/' + shortname + '.svg" height="40" width="40"> ' + name.substring(3, name.length);

	} else {
		name_span.innerText = name + "-" + level;
	}
	card.appendChild(name_span);


	var healthNormal_span = document.createElement("span");
	healthNormal_span.className = "healthNormal";
	healthNormal_span.innerText = "Normal HP " + health[0];
	card.appendChild(healthNormal_span);


	if (health[1] > 0) {
		var healthElite_span = document.createElement("span");
		healthElite_span.className = "healthElite";
		healthElite_span.innerText = "Elite HP " + health[1];
		card.appendChild(healthElite_span);
	}


	if (name.substring(0, 2) == "PC") {
		healthNormal_span.innerText = "";
		healthElite_span.innerText = "";
	}


	var initiative_span = document.createElement("span");
	initiative_span.className = "initiative";
	initiative_span.innerText = initiative;
	card.appendChild(initiative_span);

	if (shuffle) {
		var shuffle_img = document.createElement("img");
		shuffle_img.src = "images/shuffle.svg";
		card.appendChild(shuffle_img);
	}

	var current_depth = 0;
	var current_parent = card;

	lines = remove_empty_strings(lines);
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];

		var new_depth = 0;
		while (line.indexOf("*") >= 0) {
			new_depth += 1;
			line = line.substr(1);
		}
		var diff = new_depth - current_depth;

		while (current_depth != new_depth) {
			if (diff > 0) {
				// Need one level lower, create <ul>
				var list = document.createElement("ul");
				// Dynamically adapt the size to the line length. I found this the sweet spot to read all the cards
				if (lines.length > 5) {
					list.style.fontSize = (100 - (lines.length * 2.5)) + "%";
				}
				current_parent.appendChild(list);
				current_parent = list;

				// Create <li>
				var list_item = document.createElement("li");
				current_parent.appendChild(list_item);
				current_parent = list_item;

				current_depth += 1;
			} else {
				// Need to go up in the list, pop <li>
				current_parent = current_parent.parentElement;

				// pop <ul>
				current_parent = current_parent.parentElement;

				current_depth -= 1;
			}
		}

		if ((current_depth > 0) && (diff <= 0)) {
			// Same level, pop the previous <li>
			current_parent = current_parent.parentElement;

			// create sibling <li>
			var list_item = document.createElement("li");
			current_parent.appendChild(list_item);
			current_parent = list_item;
		}



		text = expand_string(line.trim(), attack, move, range);
		current_parent.insertAdjacentHTML("beforeend", text);




	}



	return card;
}

function sort_cards() {
		
		//First, build a 2 dimensional array containing the initiatives and the card names
		var init_list = document.querySelectorAll("div.card.ability.front.pull.up.discard span.initiative");
		var name_list = document.querySelectorAll("div.card.ability.front.pull.up.discard span.name");
		var background_list = document.querySelectorAll("div.card.ability.front.pull.up.discard span.name");
		var cards_array = [];

		for (i = 0; i < init_list.length; i++) {

			cards_array.push([]);
			cards_array[i][0] = init_list[i].innerHTML;


			//document.getElementById(this.id).style.background !=  "url(\"images/icon.png\") no-repeat"
			cards_array[i][1] = name_list[i].innerHTML;
		}

		//Then put them in order		
		cards_array.sort();

		//Then, change the order using CSS
		for (i = 0; i < cards_array.length; i++) {

			short_name = cards_array[i][1]
			short_name = short_name.replace(/\s/g, '');

			if (short_name.substring(0, 1) == '<') {
				//remove everying after ">" 
				short_name = "PC" + short_name.substring(short_name.indexOf(">") + 1);
			} else {
				short_name = short_name.substring(0, short_name.length - 2);
			}
			
			document.getElementById(short_name).style.order = i + 1;

		}




	}


function load_ability_deck(deck_class, deck_name, level) {
	var deck_definition = deck_definitions[deck_class];
	
	deck_definition.name = deck_name;
	deck_definition.level = level;

	var loaded_deck = JSON.parse(get_from_storage(deck_name));


	var deck = {
		class: deck_definition.class,
		name: deck_definition.name,
		type: DECK_TYPES.ABILITY,
		draw_pile: [],
		discard: [],
		move: [0, 0],
		attack: [0, 0],
		range: [0, 0],
		level: deck_definition.level,
		health: [0, 0]
	}

	for (var i = 0; i < deck_definition.cards.length; i++) {
		var definition = deck_definition.cards[i];
		var shuffle = definition[0];
		var initiative = definition[1];
		var lines = definition.slice(2);


		var empty_front = document.createElement("div");
		empty_front.className = "card ability front down";
		var card_front = empty_front;
		var card_back = create_ability_card_back(deck.name, deck.level);

		var card = {
			id: deck.name + '_' + i,
			ui: new UICard(card_front, card_back),
			shuffle_next: shuffle,
			initiative: initiative,
			starting_lines: lines,
		};

		card.paint_front_card = function(name, lines, attack, move, range, level, health) {
			this.ui.front = create_ability_card_front(this.initiative, name, this.shuffle_next, lines, attack, move, range, level, health);
		}
		if (loaded_deck && find_in_discard(loaded_deck.discard, card.id)) {
			deck.discard.push(card);
		} else {
			deck.draw_pile.push(card);
		}
	}
	deck.draw_top_discard = function() {
		if (this.discard.length > 0) {
			var card = this.discard[this.discard.length - 1];
			var cards_lines = card.starting_lines;
			var extra_lines = [];
			if (this.is_boss()) {
				var new_lines = [];
				cards_lines.forEach(function(line) {
					new_lines = new_lines.concat(special_to_lines(line, deck.special1, deck.special2));
				});
				cards_lines = new_lines;
				if (this.immunities) {
					extra_lines = extra_lines.concat(immunities_to_lines(this.immunities));
				}
				if (this.notes) {
					extra_lines = extra_lines.concat(notes_to_lines(this.notes));
				}
			} else {
				if (this.attributes) {
					extra_lines = extra_lines.concat(attributes_to_lines(this.attributes));
				}

			}

			card.paint_front_card(this.get_real_name(), cards_lines.concat(extra_lines), this.attack, this.move, this.range, this.level, this.health);

			card.ui.set_depth(-3);
			card.ui.addClass("pull");
			card.ui.flip_up(true);
			card.ui.removeClass("draw");
			card.ui.addClass("discard");
		}
		force_repaint_deck(this);
	}

	deck.draw_top_card = function() {

		var cards_lines = this.draw_pile[0].starting_lines;
		var extra_lines = [];
		if (this.is_boss()) {
			var new_lines = [];
			cards_lines.forEach(function(line) {
				new_lines = new_lines.concat(special_to_lines(line, deck.special1, deck.special2));
			});
			cards_lines = new_lines;
			if (this.immunities) {
				extra_lines = extra_lines.concat(immunities_to_lines(this.immunities));
			}
			if (this.notes) {
				extra_lines = extra_lines.concat(notes_to_lines(this.notes));
			}
		} else {
			if (this.attributes) {
				extra_lines = extra_lines.concat(attributes_to_lines(this.attributes));
			}

		}

		this.draw_pile[0].paint_front_card(this.get_real_name(), cards_lines.concat(extra_lines), this.attack, this.move, this.range, this.level, this.health);
		force_repaint_deck(this);
	}

	deck.must_reshuffle = function() {
		if (!this.draw_pile.length) {
			return true;
		} else {
			if (do_shuffles && this.discard.length) {
				return this.discard[0].shuffle_next;
			}
		}
	}

	deck.set_stats_monster = function(stats) {
		this.attack = stats.attack;
		this.move = stats.move;
		this.range = stats.range;
		this.attributes = stats.attributes;
		this.health = stats.health;
	}

	deck.set_stats_boss = function(stats) {
		this.attack = stats.attack;
		this.move = stats.move;
		this.range = stats.range;
		this.special1 = stats.special1;
		this.special2 = stats.special2;
		this.immunities = stats.immunities;
		this.notes = stats.notes;
		this.health = stats.health;
	}

	deck.get_real_name = function() {
		return (this.name) ? this.name : this.class;
	}

	deck.is_boss = function() {
		return this.class == DECKS["Boss"].class;
	}

	deck.set_card_piles = function(draw_pile, discard_pile) {
		for (var i = 0; i < draw_pile.length; i++) {
			this.draw_pile[i].shuffle_next = draw_pile[i].shuffle_next;
			this.draw_pile[i].initiative = draw_pile[i].initiative;
			this.draw_pile[i].starting_lines = draw_pile[i].starting_lines;
		}
		for (var i = 0; i < discard_pile.length; i++) {
			this.discard[i].shuffle_next = discard_pile[i].shuffle_next;
			this.discard[i].initiative = discard_pile[i].initiative;
			this.discard[i].starting_lines = discard_pile[i].starting_lines;
		}
	}

	//write_to_storage(deck.name, JSON.stringify(deck));

	return deck;

}

function place_deck(deck, container) {
	for (var i = 0; i < deck.draw_pile.length; i++) {
		var card = deck.draw_pile[i];

		card.ui.attach(container);
	}
	for (var i = 0; i < deck.discard.length; i++) {
		var card = deck.discard[i];
		card.ui.attach(container);
	}

	deck.deck_space = container;

}

function force_repaint_deck(deck) {
	prevent_pull_animation(deck);
	var space = deck.deck_space;
	remove_child(space);
	place_deck(deck, space);
}

// This should be dynamic dependent on lines per card
function refresh_ui() {
	var actual_card_height = 296;
	var base_font_size = 26.6;

	var tableau = document.getElementById("tableau");

	var cards = tableau.getElementsByClassName("card");
	for (var i = 1; i < cards.length; i++) {
		if (cards[i].className.indexOf("ability") !== -1) {
			var scale = cards[i].getBoundingClientRect().height / actual_card_height;
			var scaled_font_size = base_font_size * scale;

			var font_pixel_size = Math.min(scaled_font_size, base_font_size);
			tableau.style.fontSize = font_pixel_size + "px";
			break;
		}
	}
}

function reshuffle(deck, include_discards) {
	shuffle_deck(deck, include_discards);

	// This way we keep sync several decks from the same class
	visible_ability_decks.forEach(function(visible_deck) {
		if ((visible_deck !== deck) && (visible_deck.class == deck.class)) {
			var real_name = visible_deck.get_real_name();
			shuffle_deck(visible_deck, include_discards);
			visible_deck.set_card_piles(deck.draw_pile, deck.discard);
		}
	});
}

function shuffle_deck(deck, include_discards) {
	if (include_discards) {
		deck.draw_pile = deck.draw_pile.concat(deck.discard);
		deck.discard = [];
	}

	shuffle_list(deck.draw_pile);

	for (var i = 0; i < deck.draw_pile.length; i++) {
		var card = deck.draw_pile[i];

		card.ui.removeClass("lift");
		card.ui.removeClass("pull");

		card.ui.flip_up(false);

		card.ui.removeClass("discard");
		card.ui.addClass("draw");

		card.ui.set_depth(-i - 6);
	}
}

function flip_up_top_card(deck) {
	for (var i = 0; i < deck.discard.length; i++) {
		var card = deck.discard[i];
		card.ui.removeClass("lift");
		card.ui.removeClass("pull");
		card.ui.push_down();
	}

	if (deck.discard.length > 0) {
		deck.discard[0].ui.addClass("lift");
	}

	var card = deck.draw_pile.shift(card);
	send_to_discard(card, pull_animation = true);
	deck.discard.unshift(card);
}

function send_to_discard(card, pull_animation) {
	card.ui.set_depth(-3);

	if (pull_animation) {
		card.ui.addClass("pull");
	}

	card.ui.flip_up(true);

	card.ui.removeClass("draw");
	card.ui.addClass("discard");
}

function draw_ability_card(deck) {
	
	
	document.getElementById(deck.name.replace(/\s/g, '')).style.background = "";
	document.getElementById(deck.name.replace(/\s/g, '')).style.backgroundRepeat = "";


	if (deck.must_reshuffle()) {
		reshuffle(deck, true);
	} else {
		visible_ability_decks.forEach(function(visible_deck) {
			if (visible_deck.class == deck.class) {
				visible_deck.draw_top_card();
				flip_up_top_card(visible_deck);
			}
		});
	}

	// Does it have an initiative showing? No? Flip it again!

	var deckid = deck.get_real_name().replace(/\s+/g, '');
	var init_list = document.getElementById(deckid).querySelectorAll("div.card.ability.front.pull.up.discard span.initiative");

	if (init_list.length == 0) {
		draw_ability_card(deck);
	}

	// Now sort 
			
	sort_cards();
	


	//write_to_storage(deck.name, JSON.stringify(deck));
	
}

function prevent_pull_animation(deck) {
	if (deck.discard.length) {
		if (deck.discard[1]) {
			deck.discard[1].ui.removeClass("lift");
			deck.discard[0].ui.addClass("lift");
		}

		deck.discard[0].ui.removeClass("pull");
	}
}

function reshuffle_modifier_deck(deck) {
	deck.clean_discard_pile();
	reshuffle(deck, true);
	document.body.dispatchEvent(new CustomEvent(EVENT_NAMES.MODIFIER_DECK_SHUFFLE_REQUIRED, {
		detail: {
			shuffle: false
		}
	}));
}

function draw_modifier_card(deck) {
	deck.clean_advantage_deck();

	if (deck.must_reshuffle()) {
		reshuffle_modifier_deck(deck);
	} else {
		flip_up_top_card(deck);

		document.body.dispatchEvent(new CustomEvent(
			EVENT_NAMES.MODIFIER_CARD_DRAWN, {
				detail: {
					card_type: deck.discard[0].card_type,
					count: deck.count(deck.discard[0].card_type)
				}
			}));

		if (deck.shuffle_end_of_round()) {
			document.body.dispatchEvent(new CustomEvent(EVENT_NAMES.MODIFIER_DECK_SHUFFLE_REQUIRED, {
				detail: {
					shuffle: true
				}
			}));
		}
	}
	write_to_storage("modifier_deck", JSON.stringify(deck));
}

function double_draw(deck) {
	var advantage_card;
	// Case there was 1 card in draw_pile when we clicked "draw 2".
	//    now we should draw, save that card, reshuffle, and_
	//    draw the next
	if (deck.draw_pile.length == 1) {
		draw_modifier_card(deck);
		advantage_card = deck.discard[0];
		reshuffle_modifier_deck(deck);
		advantage_card = deck.draw_pile.shift(advantage_card);
		send_to_discard(advantage_card, pull_animation = false);
		deck.discard.unshift(advantage_card);
		draw_modifier_card(deck);
	}
	// Case there were 0 cards in draw_pile when we clicked "draw 2".
	//    we should reshuffle, draw 1 and send it to advantage_place,
	//    draw the next
	else if (deck.draw_pile.length == 0) {
		// This is in case the previous draw was double as well
		deck.clean_advantage_deck();
		reshuffle_modifier_deck(deck);
		draw_modifier_card(deck);
		advantage_card = deck.discard[0];
		draw_modifier_card(deck);
	}
	// Every other simple case
	else {
		draw_modifier_card(deck);
		advantage_card = deck.discard[0];
		draw_modifier_card(deck);
	}
	deck.discard[0].ui.addClass("right");
	advantage_card.ui.addClass("left");
	deck.advantage_to_clean = true;
}

function load_modifier_deck() {
	var deck = {
		name: "Monster modifier deck",
		type: DECK_TYPES.MODIFIER,
		draw_pile: [],
		discard: [],
		advantage_to_clean: false
	}

	deck.draw_top_discard = function() {
		if (this.discard.length > 0) {
			var card = this.discard[this.discard.length - 1];
			card.ui.set_depth(-3);
			card.ui.addClass("pull");
			card.ui.flip_up(true);
			card.ui.removeClass("draw");
			card.ui.addClass("discard");
		}
		force_repaint_deck(this);
	}

	deck.count = function(card_type) {
		return (this.draw_pile.filter(function(card) {
			return card.card_type === card_type;
		}).length);
	}.bind(deck);

	deck.remove_card = function(card_type) {
		for (var i = 0; i < deck.draw_pile.length; i++) {
			if (deck.draw_pile[i].card_type == card_type) {
				deck.draw_pile.splice(i, 1);
				reshuffle(deck, false);

				force_repaint_deck(deck);
				break;
			}
		}
		write_to_storage("modifier_deck", JSON.stringify(modifier_deck));

		return this.count(card_type);
	}.bind(deck);

	deck.add_card = function(card_type) {
		// Rulebook p. 23: "a maximum of only 10 curse [and 10 bless] cards can be placed into any one deck"
		if (this.count(card_type) < 10) {
			// TOOD: Brittle
			deck.draw_pile.push(define_modifier_card(MODIFIER_CARDS[card_type.toUpperCase()]));

			force_repaint_deck(deck);
			reshuffle(deck, false);
		}
		write_to_storage("modifier_deck", JSON.stringify(modifier_deck));

		return this.count(card_type);
	}.bind(deck);

	deck.shuffle_end_of_round = function() {
		return this.discard.filter(function(card) {
			return card.shuffle_next_round;
		}).length > 0;
	}.bind(deck);

	deck.must_reshuffle = function() {
		return !this.draw_pile.length;
	}.bind(deck);

	deck.clean_discard_pile = function() {
		for (var i = 0; i < deck.discard.length; i++) {
			if (this.discard[i].card_type == CARD_TYPES_MODIFIER.BLESS ||
				this.discard[i].card_type == CARD_TYPES_MODIFIER.CURSE) {
				//Delete this curse/bless that has been used
				this.discard.splice(i, 1);
				i--;
			}
		}

		// This is needed every time we update
		force_repaint_deck(this);
	}.bind(deck);

	deck.clean_advantage_deck = function() {
		if ((deck.advantage_to_clean) && deck.discard[1]) {
			deck.advantage_to_clean = false;
			deck.discard[0].ui.removeClass("right");
			deck.discard[0].ui.removeClass("left");
			deck.discard[1].ui.removeClass("left");
			deck.discard[1].ui.removeClass("left");
		}
	}.bind(deck);
	var loaded_deck = JSON.parse(get_from_storage("modifier_deck"));

	MODIFIER_DECK.forEach(function(card_definition) {
		var card = define_modifier_card(card_definition);
		if (loaded_deck && find_in_discard_and_remove(loaded_deck.discard, card.card_type)) {
			deck.discard.push(card);
		} else {
			deck.draw_pile.push(card);
		}
	});

	return deck;
}

function find_in_discard_and_remove(discard, card_type) {
	for (var i = 0; i < discard.length; i++) {
		if (discard[i].card_type === card_type) {
			return discard.splice(i, 1);
		}
	}
	return null;
}

function create_modifier_card_back() {
	var card = document.createElement("div");
	card.className = "card modifier back";

	return card;
}

function create_modifier_card_front(card_url) {
	var img = document.createElement("img");
	img.className = "cover";
	img.src = card_url;

	var card = document.createElement("div");
	card.className = "card modifier front";
	card.appendChild(img);

	return card;
}

function define_modifier_card(card_definition) {
	var card_front = create_modifier_card_front(card_definition.image);
	var card_back = create_modifier_card_back();

	var card = {
		ui: new UICard(card_front, card_back),
		card_type: card_definition.type,
		shuffle_next_round: card_definition.shuffle
	};

	return card;
}

function end_round() {

}

function load_definition(card_database) {
	var decks = {};
	for (var i = 0; i < card_database.length; i++) {
		var definition = card_database[i];
		decks[definition.class] = definition;
	}

	return decks;
}

function get_monster_stats(name, level) {
	
	var attack = [MONSTER_STATS["monsters"][name]["level"][level]["normal"]["attack"],
		MONSTER_STATS["monsters"][name]["level"][level]["elite"]["attack"]
	];
	var move = [MONSTER_STATS["monsters"][name]["level"][level]["normal"]["move"],
		MONSTER_STATS["monsters"][name]["level"][level]["elite"]["move"]
	];
	var range = [MONSTER_STATS["monsters"][name]["level"][level]["normal"]["range"],
		MONSTER_STATS["monsters"][name]["level"][level]["elite"]["range"]
	];
	var attributes = [MONSTER_STATS["monsters"][name]["level"][level]["normal"]["attributes"],
		MONSTER_STATS["monsters"][name]["level"][level]["elite"]["attributes"]
	];

	var health = [MONSTER_STATS["monsters"][name]["level"][level]["normal"]["health"],
		MONSTER_STATS["monsters"][name]["level"][level]["elite"]["health"]
	];

	return {
		"attack": attack,
		"move": move,
		"range": range,
		"attributes": attributes,
		"health": health
	};


}

function get_boss_stats(name, level) {
	name = name.replace("Boss: ", "");
	var attack = [MONSTER_STATS["bosses"][name]["level"][level]["attack"]];
	var move = [MONSTER_STATS["bosses"][name]["level"][level]["move"]];
	var range = [MONSTER_STATS["bosses"][name]["level"][level]["range"]];
	var special1 = MONSTER_STATS["bosses"][name]["level"][level]["special1"];
	var special2 = MONSTER_STATS["bosses"][name]["level"][level]["special2"];
	var immunities = MONSTER_STATS["bosses"][name]["level"][level]["immunities"];
	var notes = MONSTER_STATS["bosses"][name]["level"][level]["notes"];
	var health = [MONSTER_STATS["bosses"][name]["level"][level]["health"]];

	return {
		"attack": attack,
		"move": move,
		"range": range,
		"special1": special1,
		"special2": special2,
		"immunities": immunities,
		"notes": notes,
		"health": health
	}
}

function apply_deck_selection(decks, preserve_existing_deck_state) {
	var container = document.getElementById("tableau");
	document.getElementById("currentdeckslist").innerHTML = "";
	var decks_to_remove = visible_ability_decks.filter(function(visible_deck) {
		return !preserve_existing_deck_state || (decks.filter(function(deck) {
			return ((deck.name == visible_deck.name) && (deck.level == visible_deck.level)) 
		}).length == 0);
	});

	var decks_to_add = decks.filter(function(deck) {
		return !preserve_existing_deck_state || (visible_ability_decks.filter(function(visible_deck) {
			return ((deck.name == visible_deck.name) && (deck.level == visible_deck.level))
		}).length == 0);
	});

	

	decks_to_remove.forEach(function(deck) {
		deck.discard_deck();
	});

	decks_to_add.forEach(function(deck) {
		var deckid = deck.get_real_name().replace(/\s+/g, '');
		var deck_space = document.createElement("div");
		deck_space.id = deckid;


		deck_space.addEventListener('contextmenu', function(e) {


			// When we right click, add a skull, but only if the card isn't blank (which we can check by seeing if the card displays an initiative

			if (document.getElementById(this.id).style.background != "url(\"images/icon.png\") 0% 0% / 120px 120px no-repeat") {
				document.getElementById(this.id).style.background = "url(\"images/icon.png\") 0% 0% / 120px 120px no-repeat";

			} else {
				document.getElementById(this.id).style.background = "";

			}


			var init_list = document.getElementById(this.id).querySelectorAll("div.card.ability.front.pull.up.discard span.initiative");
			if (init_list[0] != undefined) {

				if (init_list[0].innerHTML.substring(0, 1) != "X") {

					init_list[0].innerHTML = "X" + init_list[0].innerHTML.substring(0, 2);
				} else {

					init_list[0].innerHTML = init_list[0].innerHTML.substring(1, 3);
				}
			}

			e.preventDefault();
			sort_cards();
		}, false)
		deck_space.className = "card-container";
		deck_space.title = "Click to draw card, right click to disable deck ";
		container.appendChild(deck_space);
		place_deck(deck, deck_space);
		reshuffle(deck, !preserve_existing_deck_state);
		if (preserve_existing_deck_state) {

		}



		deck_space.onclick = draw_ability_card.bind(null, deck);




		deck.discard_deck = function() {
			var index = visible_ability_decks.indexOf(this);

			if (index > -1) {
				visible_ability_decks.splice(index, 1);
			}

			container.removeChild(deck_space);
		};

		if (deck.is_boss()) {
			// We don't want stats if someone selects Boss on the deck tab
			if (deck.get_real_name() != "Boss") {
				deck.set_stats_boss(get_boss_stats(deck.get_real_name(), deck.level));
			}
		} else {
			deck.set_stats_monster(get_monster_stats(deck.get_real_name(), deck.level));

		}
		reshuffle(deck);
		if (preserve_existing_deck_state) {
			deck.draw_top_discard();
		} else {
			force_repaint_deck(deck);
		}
		visible_ability_decks.push(deck);

		var currentdeckslist = document.getElementById("currentdeckslist");
		var list_item = document.createElement("li");
		list_item.className = "currentdeck";
		// Add the following line to put the line back in 
		//currentdeckslist.appendChild(list_item);
		var label = document.createElement("a");
		label.id = "switch-" + deckid;
		label.href = "#switch-" + deckid
		label.innerText = deck.get_real_name();
		label.title = "Click to show/hide deck";
		label.addEventListener("click", function(e) {
			var d = document.getElementById(this.id.replace("switch-", ""));
			d.className = (d.className == "hiddendeck") ? "card-container" : "hiddendeck";
		}, false)
		list_item.appendChild(label);
	});

	// Rescale card text if necessary
	refresh_ui();
}

function init_modifier_deck() {
	modifier_deck = load_modifier_deck();
}

function count_type(type, deck) {
	var count = 0;
	if (deck) {
		for (var i = 0; i < deck.draw_pile.length; i++) {
			if (deck.draw_pile[i].card_type === type) {
				count++;
			}
		}
	}
	return count;
}

function add_modifier_deck(container, deck, preserve_discards) {
	function create_counter(card_type, increment_func, decrement_func, title) {
		function create_button(class_name, text, func, text_element) {
			var button = document.createElement("div");
			button.className = class_name + " button";
			button.innerText = text;

			button.onclick = function() {
				text_element.innerText = func(card_type);
			};

			return button;
		}

		var widget_container = document.createElement("div");
		widget_container.className = "counter-icon";
		widget_container.title = title;

		var background = document.createElement("div");
		background.className = "background " + card_type;
		widget_container.appendChild(background);

		var text_element = document.createElement("div");
		text_element.className = "icon-text";
		text_element.innerText = "0";

		widget_container.appendChild(create_button("decrement", "-", decrement_func, text_element));
		widget_container.appendChild(text_element);
		widget_container.appendChild(create_button("increment", "+", increment_func, text_element));

		document.body.addEventListener(EVENT_NAMES.MODIFIER_CARD_DRAWN, function(e) {
			if (e.detail.card_type === card_type) {
				text_element.innerText = e.detail.count;
			}
		});

		return widget_container;
	}

	function indicate_shuffle_required(e) {
		if (e.detail.shuffle) {
			window.setTimeout(function() {
				end_round_div.className = "counter-icon shuffle";
			}, 400);
		} else {
			end_round_div.className = "counter-icon shuffle not-required";
		}
	}

	var modifier_container = document.createElement("div");
	modifier_container.className = "card-container";
	modifier_container.id = "modifier-container";

	var button_div = document.createElement("div");
	button_div.className = "modifier-deck-column-1";

	button_div.appendChild(create_counter("bless", deck.add_card, deck.remove_card, "Bless cards"));
	button_div.appendChild(create_counter("curse", deck.add_card, deck.remove_card, "Curse cards"));

	var end_round_div = document.createElement("div");
	end_round_div.className = "counter-icon shuffle not-required";
	end_round_div.onclick = end_round;
	end_round_div.title = "Click to end round and shuffle";

	document.body.addEventListener(EVENT_NAMES.MODIFIER_DECK_SHUFFLE_REQUIRED, indicate_shuffle_required);

	button_div.appendChild(end_round_div);

	var deck_column = document.createElement("div");
	deck_column.className = "modifier-deck-column-2";

	var deck_space = document.createElement("div");
	deck_space.className = "card-container modifier";
	deck_space.title = "Click to draw one card";

	var draw_two_button = document.createElement("div");
	draw_two_button.className = "button draw-two";
	draw_two_button.onclick = double_draw.bind(null, modifier_deck);
	draw_two_button.title = "Click to draw two cards";

	deck_column.appendChild(deck_space);
	deck_column.appendChild(draw_two_button);

	modifier_container.appendChild(deck_column);
	modifier_container.appendChild(button_div);

	container.appendChild(modifier_container);

	place_deck(deck, deck_space);
	reshuffle(deck, !preserve_discards);
	deck_space.onclick = draw_modifier_card.bind(null, deck);
}

function LevelSelector(text, inline) {
	var max_level = 7;
	var level = {};
	level.html = inline ? document.createElement("span") : document.createElement("ul");
	level.html.className = "levellist";

	var listitem = inline ? document.createElement("label") : document.createElement("li");
	listitem.innerText = text;
	level.html.appendChild(listitem);



	var level_spinner = create_input("number", "scenario_number", "1", "");
	level_spinner.input.min = 0;
	level_spinner.input.max = max_level;
	level.html.appendChild(level_spinner.input);
	level.spinner = level_spinner.input;

	level.get_selection = function() {
		
		return (this.spinner.value > max_level) ? max_level : this.spinner.value;
	}

	level.set_value = function(value) {		
		this.spinner.value = (value > max_level) ? max_level : value;
	}

	return level;
}

function DeckList() {
	var decklist = {};
	decklist.ul = document.createElement("ul");
	decklist.ul.className = "selectionlist";
	decklist.checkboxes = {};
	decklist.level_selectors = {};
	decklist.global_level_selector = null;


	var listitem = document.createElement("li");
	var global_level_selector = new LevelSelector("Set level for all monsters: ", true);
	listitem.appendChild(global_level_selector.html);
	
	

	
	decklist.global_level_selector = global_level_selector;

	var dom_dict = create_input("button", "applylevel", "Apply", "");
	dom_dict.input.onclick = function() {
		for (key in decklist.level_selectors) {
			decklist.level_selectors[key].set_value(decklist.global_level_selector.get_selection());
		}
	};
	listitem.appendChild(dom_dict.root);
	
	var hr = document.createElement('hr');// make a hr
        listitem.appendChild(hr);// append the hr
	
	
	decklist.ul.appendChild(listitem);
	
	for (key in DECKS) {
		var real_name = DECKS[key].name;
		
		if (real_name.substring(0,2) != "PC"){
			var listitem = document.createElement("li");
			listitem.style ="display: flex;justify-content: space-between;"
			
			var dom_dict = create_input("checkbox", "deck", real_name, real_name);
			
			listitem.appendChild(dom_dict.root);

			var level_selector = new LevelSelector("", true);			
			listitem.appendChild(level_selector.html);


			decklist.ul.appendChild(listitem);
			decklist.checkboxes[real_name] = dom_dict.input;
			decklist.level_selectors[real_name] = level_selector;
		}
	};

	decklist.get_selection = function() {
		return dict_values(this.checkboxes).filter(is_checked).map(input_value);
	}

	decklist.get_selected_decks = function() {
		var selected_checkbox = this.get_selection();
		var selected_decks = concat_arrays(selected_checkbox.map(function(name) {
			var deck = ((name in DECKS) ? DECKS[name] : []);
			deck.level = decklist.level_selectors[name].get_selection();
			return deck;
		}.bind(this)));

		return selected_decks;
	}

	decklist.set_selection = function(selected_deck_names) {
		dict_values(this.checkboxes).forEach(function(checkbox) {
			checkbox.checked = false;
		});

		selected_deck_names.forEach(function(deck_names) {
			var checkbox = this.checkboxes[deck_names.name];
			if (checkbox) {
				checkbox.checked = true;
				decklist.level_selectors[deck_names.name].set_value(deck_names.level);
			}
		}.bind(this));
	}

	return decklist;
}

function ScenarioList(scenarios) {
	var scenariolist = {};
	scenariolist.ul = document.createElement("ul");
	scenariolist.ul.className = "selectionlist";
	scenariolist.spinner = null;
	scenariolist.decks = {};
	scenariolist.special_rules = {};
	scenariolist.level_selector = null;

	scenariolist.level_selector = new LevelSelector("Select difficulty level ", true);

	scenariolist.ul.appendChild(scenariolist.level_selector.html);

	for (var i = 0; i < scenarios.length; i++) {
		var scenario = scenarios[i];
		scenariolist.decks[i] = scenario.decks;
		scenariolist.special_rules[i] = scenario.special_rules ? scenario.special_rules : "";
	}
		
	var listitem = document.createElement("li");
	listitem.innerText = "Select scenario";
	scenariolist.ul.appendChild(listitem);
	
	var scenario_spinner = create_input("number", "scenario_number", "1", "");
	scenario_spinner.input.min = 1;
	scenario_spinner.input.max = scenarios.length;	
	scenariolist.ul.appendChild(scenario_spinner.input);
	scenariolist.spinner = scenario_spinner.input;

		scenariolist.get_selection = function() {
		// We're using the scenario index that is zero-based, but the scenario list is 1-based
		var current_value = scenariolist.spinner.value - 1;
		return Math.min(current_value, scenarios.length + 1);
	}

	scenariolist.get_level = function(deck_name, special_rules) {

		var base_level = scenariolist.level_selector.get_selection();

		if ((special_rules.indexOf(SPECIAL_RULES.living_corpse_two_levels_extra) >= 0) && (deck_name == SPECIAL_RULES.living_corpse_two_levels_extra.affected_deck)) {
			return Math.min(7, (parseInt(base_level) + parseInt(SPECIAL_RULES.living_corpse_two_levels_extra.extra_levels)));
		} else {
			return base_level;
		}
	}

	scenariolist.get_scenario_decks = function() {


		return (this.decks[this.get_selection()].map(function(deck) {

			if (DECKS[deck.name]) {
				deck.class = DECKS[deck.name].class;

			} else if (deck.name.indexOf("Boss") != -1) {

				deck.class = DECKS["Boss"].class;
			}
			deck.level = scenariolist.get_level(deck.name, scenariolist.get_special_rules());

			return deck;
		}));
	}

	scenariolist.get_special_rules = function() {
		return this.special_rules[this.get_selection()];
	}

	return scenariolist;
}

function init() {
	var deckspage = document.getElementById("deckspage");
	var scenariospage = document.getElementById("scenariospage");
	var applydeckbtn = document.getElementById("applydecks");
	var applyscenariobtn = document.getElementById("applyscenario");



	var new_roundbtn = document.getElementById("new_round");
	
	var end_roundbtn = document.getElementById("end_round");

	document.onkeypress = function() {
		numbered_elements(event)
	};



	function numbered_elements(event) {


		//Don't do anything if panel is outerHTML

		if (document.getElementById("settingspane").className == "pane inactive") {

			//Take 48 away from the character code to get the number

			switch (event.charCode - 48) {

				case 0:
					sort_cards();

					break;
				case 1:
					change_element_border('element_air', 'false');
					break;

				case 1:
					change_element_border('element_air', 'false');
					break;
				case 2:
					change_element_border('element_earth', 'false');
					break;
				case 3:
					change_element_border('element_fire', 'false');
					break;
				case 4:
					change_element_border('element_ice', 'false');
					break;
				case 5:
					change_element_border('element_light', 'false');
					break;
				case 6:
					change_element_border('element_dark', 'false');


			}
		}
	}

	var showmodifierdeck = document.getElementById("showmodifierdeck");

	var decklist = new DeckList();
	var scenariolist = new ScenarioList(SCENARIO_DEFINITIONS);

	deckspage.insertAdjacentElement("afterbegin", decklist.ul);
	scenariospage.insertAdjacentElement("afterbegin", scenariolist.ul);



	applydeckbtn.onclick = function() {
		show_game_elements();
		
		
		base_level = scenariolist.level_selector.get_selection();
		
		if (base_level == 7) {
			gold = 6;
		} else {
			gold = Math.floor(base_level / 2) + 2;
		}

		trap_damage = 2 + Number(base_level);

		hazardous_terrain = Math.floor(trap_damage / 2);

		bonus_xp = 4 + (base_level * 2);

		document.querySelector("#scenariro_Level").innerHTML =  base_level;
		document.querySelector("#gold_conversion").innerHTML =  gold;
		document.querySelector("#trap_damage").innerHTML =  trap_damage;
		document.querySelector("#hazardous_terrain").innerHTML = hazardous_terrain;
		document.querySelector("#bonus_xp").innerHTML =  bonus_xp;

		
		
		
		var selected_deck_names = decklist.get_selected_decks();
		
		
			class_array = document.getElementsByName("class_name");
			for (i = 0; i < class_array.length; i++) {			
				if (document.getElementsByName("class_name")[i].style.visibility == "visible") {				
					class_name = document.getElementsByName("class_name")[i].id;
					class_level = document.querySelector("#" + class_name + "_level").value;
					//replace the _ with a space 
					class_name  = class_name.replace(/_/g, " ");			
				
					class_name = class_name.charAt(0).toUpperCase() + class_name.slice(1);
				
					class_string = '{"name": "PC ' + class_name + '", "class": "' + class_name + '", "level": "' + class_level + '"}';
				
					json_string = JSON.parse(class_string);
				
					selected_deck_names[selected_deck_names.length] = json_string;
				}
			}
		
		var selected_decks = selected_deck_names.map(function(deck_names) {
			return load_ability_deck(deck_names.class, deck_names.name, deck_names.level);
		});
		
		apply_deck_selection(selected_decks, false);
		
		
	};

	save_party = function() {
		//Store team names and levels

		var team_array = [];
		var class_array = [];
		count = 0;

		total_characters = document.getElementsByName("class_name");
		for (i = 0; i < total_characters.length; i++) {
			if (document.getElementsByName("class_name")[i].style.visibility == "visible") {

				class_array[0] = document.getElementsByName("class_name")[i].id;
				class_array[1] = document.querySelector("#" + class_array[0] + "_level").value;
				team_array.push([class_array[0], class_array[1]]);

			}
		}

		write_to_storage("team_array", JSON.stringify(team_array));

	}

	change_suggested_level = function() {
		total_levels = 0;
		active_characters = 0;
		total_characters = document.getElementsByName("class_name");
		for (i = 0; i < total_characters.length; i++) {
			if (document.getElementsByName("class_name")[i].style.visibility == "visible") {
				active_characters = active_characters + 1;
				name = document.getElementsByName("class_name")[i].id;
				total_levels = total_levels + parseInt(document.querySelector("#" + name + "_level").value);


			}
		}

	
		//set the level to the calculated level or 7, whichever is lower 
		if (active_characters != 0){
			document.querySelector("#scenariospage > ul > span > input[type=number]").value = Math.min(7, Math.ceil((total_levels / active_characters)/2));
			document.querySelector("#deckspage > ul > li:nth-child(1) > span > input[type=number]").value = Math.min(7, Math.ceil((total_levels / active_characters)/2));
			document.querySelectorAll("#deckspage > ul > li:nth-child(1) > label > input[type=button]")[0].click();
			document.getElementById("difficulty").innerHTML = Math.min(7, Math.ceil((total_levels / active_characters)/2).toString());
			document.getElementById("adjusted_level").innerHTML = Math.min(7, Math.ceil((total_levels / active_characters)/2).toString());
			
		}
	}
	load_party = function() {
		//First, hide all existing characters



		//Load in the previous stored data
		var player_array = JSON.parse(get_from_storage("team_array"));
	
		
		//Load in the previous stored data
		var player_array = JSON.parse(get_from_storage("team_array"));
	   	 
		//loop through and put in the characters levels
		if (player_array != null){
		    for (i = 0; i < player_array.length; i++) {
		    	
		    	change_party(player_array[i][0]);
		    	document.querySelector("#" + player_array[i][0] + "_level").value = player_array[i][1];
		    }
		}

	}



	applyscenariobtn.onclick = function() {
	
	//Take the values from my form and put them in the old form
		document.querySelector("#scenariospage > ul > span > input[type=number]").value = parseInt(document.querySelector("#adjusted_level").innerHTML);
		document.querySelector("#scenariospage > ul > input[type=number]").value = document.querySelector("#scenario_picker").value;	
		
	show_game_elements();
		
		base_level = parseInt(document.getElementById("adjusted_level").innerHTML);
		
		if (base_level == 7) {
			gold = 6;
		} else {
			gold = Math.floor(base_level / 2) + 2;
		}

		trap_damage = 2 + Number(base_level);

		hazardous_terrain = Math.floor(trap_damage / 2);

		bonus_xp = 4 + (base_level * 2);

		document.querySelector("#scenariro_Level").innerHTML =  base_level;
		document.querySelector("#gold_conversion").innerHTML =  gold;
		document.querySelector("#trap_damage").innerHTML =  trap_damage;
		document.querySelector("#hazardous_terrain").innerHTML =  hazardous_terrain;
		document.querySelector("#bonus_xp").innerHTML =  bonus_xp;
		
		
		
		var selected_deck_names = scenariolist.get_scenario_decks();

		class_array = document.getElementsByName("class_name");
		for (i = 0; i < class_array.length; i++) {
			if (document.getElementsByName("class_name")[i].style.visibility == "visible") {
				class_name = document.getElementsByName("class_name")[i].id;
				class_level = document.querySelector("#" + class_name + "_level").value;
				//replace the _ with a space 
				class_name  = class_name.replace(/_/g, " ");
										
				
				
				class_name = class_name.charAt(0).toUpperCase() + class_name.slice(1);
				
				class_string = '{"name": "PC ' + class_name + '", "class": "' + class_name + '", "level": "' + class_level + '"}'
				
				json_string = JSON.parse(class_string);
				
				selected_deck_names[selected_deck_names.length] = json_string;
			}
		}




		decklist.set_selection(selected_deck_names);
		var selected_decks = selected_deck_names.map(function(deck_names) {
			return load_ability_deck(deck_names.class, deck_names.name, deck_names.level);
		});

		apply_deck_selection(selected_decks, false);




	};



	new_roundbtn.onclick = function() {

		//Get the round number from the button text. If the substring returns 'Game' it's the first round, so set round to 0
		round = document.getElementById("round_count").innerHTML;
		
		if (round == '-') {
			round = 0
		};
		round = parseInt(round, 10) + 1;


		if (confirm('Are you sure you want to put in initiatives for Round ' + round + '? Make sure to right click any monsters to deactivate them first.')) {

			//Run the 'end round' sequence
			end_round();
			// Lower the elements, passing 'true' to ensure they don't loop inert to strong
			change_element_border('element_fire', 'true');
			change_element_border('element_air', 'true');
			change_element_border('element_ice', 'true');
			change_element_border('element_earth', 'true');
			change_element_border('element_light', 'true');
			change_element_border('element_dark', 'true');

			//New Round! Update the button!

			document.getElementById("new_round").value = 'New Round';
			document.getElementById("round_count").innerHTML = round;
			

			//First, flip all the unskulled cards

			var name_list = document.getElementsByClassName('card-container');

			//for (a = 2; a < name_list.length; a++) {
			for (a = 0; a < name_list.length; a++) {
			
				card_init = name_list[a].querySelectorAll("div.card.ability.front.pull.up.discard span.initiative")[0];




				//.style.background !=  "url(\"images/icon.png\") 0% 0% / 120px 120px no-repeat"

				if (name_list[a].style.background != "url(\"images/icon.png\") 0% 0% / 120px 120px no-repeat") {
					name_list[a].click();
				}
				//else if (card_init.innerHTML.substring(0,1) != "X")
				//{
				//		name_list[a].click();
				//}
			}




			//Next, build a 2 dimensional array containing the initiatives and the card names
			var init_list = document.querySelectorAll("div.card.ability.front.pull.up.discard span.initiative");
			var name_list = document.querySelectorAll("div.card.ability.front.pull.up.discard span.name");
			var cards_array = [];
			for (i = 0; i < init_list.length; i++) {
				cards_array.push([]);
				cards_array[i][0] = init_list[i].innerHTML
				cards_array[i][1] = name_list[i].innerHTML
			}

			//Now loop through the list and produce the 'short name' by stripping the last two characters and the spaces, then use that to build up a list of active cards
			for (i = 0; i < cards_array.length; i++) {
				short_name = cards_array[i][1];
				short_name = short_name.replace(/\s/g, '');


				//If a cards HTML starts with '<', then it's a PC card. Ask for the initiative, and put it in.

				if (short_name.substring(0, 1) == '<') {
					//remove everying after ">" a
					short_name = short_name.substring(short_name.indexOf(">") + 1);



					x = document.getElementById("PC" + short_name);

					x = x.getElementsByClassName('name')[0].innerHTML;


									
					if (document.getElementById("PC" + short_name).style.background != 'url("images/icon.png") 0% 0% / 120px 120px no-repeat'){
					
					new_init = window.prompt("New Initiative for " + short_name);
					if (new_init.length == 1) {
						new_init = "0" + new_init;
					}
					if (new_init.length == 0) {
						new_init = "99" + new_init;
					}
					document.querySelectorAll("div.card.ability.front.pull.up.discard span.initiative")[i].innerHTML = new_init;
					}
					else
					{
					document.querySelectorAll("div.card.ability.front.pull.up.discard span.initiative")[i].innerHTML = "**";
					}
				}


			}




			//Lastly, may as well refresh the order at this point.
			sort_cards();

		}
	}

	function update_stats() {

		//Change Scenario stats
		x = parseInt(document.getElementsByName("scenario_number")[0].value) + parseInt(document.getElementById("level_modifier").value);
		if (x > 7) {
			x = 7;
		}
		if (x < 0) {
			x = 0;
		}


		document.getElementById("monster_level").innerHTML = x;
		document.getElementById("gold_level").innerHTML = Math.floor(x / 2) + 2;
		document.getElementById("trap_damage").innerHTML = x + 2;
		document.getElementById("bonus_xp").innerHTML = 2 * x + 4;
	}

	






	//There is probably a more clever way of doing this, but this will do.



	element_air.onclick = function() {
		change_element_border('element_air', 'false')
	}

	element_earth.onclick = function() {
		change_element_border('element_earth', 'false')
	}

	element_fire.onclick = function() {
		change_element_border('element_fire', 'false')
	}

	element_ice.onclick = function() {
		change_element_border('element_ice', 'false')
	}

	element_light.onclick = function() {
		change_element_border('element_light', 'false')
	}

	element_dark.onclick = function() {
		change_element_border('element_dark', 'false')
	}

	change_element_border = function(element, is_it_locked) {

		switch (element) {
			case "element_air":
				color = "rgb(152, 176, 181)";
				break;
			case "element_earth":
				color = "rgb(125, 168, 42)";
				break;
			case "element_fire":
				color = "rgb(226, 66, 31)";
				break;
			case "element_ice":
				color = "rgb(86, 200, 239)";
				break;
			case "element_light":
				color = "rgb(236, 166, 16)";
				break;
			case "element_dark":
				color = "rgb(32, 40, 48)";
				break;
		}

		el_style = window.getComputedStyle(document.getElementById(element));
		el_style = el_style.border;



		//if it's strong, make it waning

		if (el_style == "20px solid " + color) {

			document.getElementById(element).style.border = "20px dashed " + color;

		}

		//if it's waning, make it inert
		else if (el_style == "20px dashed " + color) {

			document.getElementById(element).style.border = "20px solid rgb(255, 255, 255)";

		}

		//if it's inert, make it strong, but only if not locked i.e. not from a button press
		else if (el_style == "20px solid rgb(255, 255, 255)" && is_it_locked == 'false') {

			document.getElementById(element).style.border = "20px solid " + color;
		}

		//document.getElementById(element).style.border = "thick solid #0000FF"; && is_it_locked

	}

	brute_icon.onclick = function() {
		change_party("brute")
	}

	tinkerer_icon.onclick = function() {
		change_party("tinkerer")
	}
	spellweaver_icon.onclick = function() {
		change_party("spellweaver")
	}
	scoundrel_icon.onclick = function() {
		change_party("scoundrel")
	}
	cragheart_icon.onclick = function() {
		change_party("cragheart")
	}
	mindthief_icon.onclick = function() {
		change_party("mindthief")
	}
	sunkeeper_icon.onclick = function() {
		change_party("sunkeeper")
	}
	quartermaster_icon.onclick = function() {
		change_party("quartermaster")
	}
	summoner_icon.onclick = function() {
		change_party("summoner")
	}
	nightshroud_icon.onclick = function() {
		change_party("nightshroud")
	}
	plagueherald_icon.onclick = function() {
		change_party("plagueherald")
	}
	soothsinger_icon.onclick = function() {
		change_party("soothsinger")
	}
	doomstalker_icon.onclick = function() {
		change_party("doomstalker")
	}
	elementalist_icon.onclick = function() {
		change_party("elementalist")
	}
	Beast_Tyrant_icon.onclick = function() {
		change_party("Beast_Tyrant")
	}
	sawbones_icon.onclick = function() {
		change_party("sawbones")
	}
	berserker_icon.onclick = function() {
		change_party("berserker")
	}


	change_party = function(base_class) {


		class_icon = base_class + "_icon";
		class_level = base_class + "_td_level"

		icon_style = window.getComputedStyle(document.getElementById(class_icon));
		icon_style = icon_style.opacity;

		if (icon_style == 1) {
			document.getElementById(base_class).style.visibility = "hidden";
			document.getElementById(class_level).style.visibility = "hidden";
			document.getElementById(class_icon).style.opacity = ".5";
		} else {
			document.getElementById(base_class).style.visibility = "visible";
			document.getElementById(class_level).style.visibility = "visible";
			document.getElementById(class_icon).style.opacity = "1";

		}


	}
	
	show_game_elements= function(){
		document.getElementById("elements").style.display=  "block";
		document.getElementById("new_round").style.display= "block";
		document.getElementById("round_count").style.display= "block";
		
		document.querySelector("#treasure > span:nth-child(1)").style.visibility="hidden";
		document.querySelector("#treasure > span:nth-child(2)").style.visibility="hidden";
		document.querySelector("#treasure > span:nth-child(3)").style.visibility="hidden";
		
		var request = new XMLHttpRequest();
   		request.open("GET", "scenariostracker/src/assets/scenarios.json", false);
   		request.send(null)
   		scenario_data_JSON = JSON.parse(request.responseText);
		
		scenario_numbers=[]				
		for (i = 0; i < scenario_data_JSON.nodes.length; i++) {
			scenario_numbers[i]=scenario_data_JSON.nodes[i].data.id;
		}
				
		scenario=parseInt(document.querySelector("#scenario_picker").value);
		
		scenario=scenario_numbers.indexOf(scenario.toString());
				
		if (scenario > 0){
			treasure = scenario_data_JSON.nodes[scenario].data.treasure;		
			treasure_number=Object.keys(treasure);
			treasure_description=[];		
			for (var i = 0; i < Object.keys(treasure).length; i++){			
				treasure_description[i] = treasure[treasure_number[i]].description;
				document.getElementById('treasure').children.item(i).style.visibility ="visible";
				document.getElementById('treasure').children.item(i).innerHTML = treasure_number[i];
				document.getElementById('treasure').children.item(i).title = "Treasure " + treasure_number[i] + " : " + treasure_description[i]			
			}	
		}
		
	}
	


	
	window.onresize = refresh_ui.bind(null, visible_ability_decks);

	
	show_available_scenarios =function(){
		document.getElementById("scenario_picker").innerHTML = "";
		
		var request = new XMLHttpRequest();
   		request.open("GET", "scenariostracker/src/assets/scenarios.json", false);
   		request.send(null)
   		var scenario_data_JSON = JSON.parse(request.responseText);

		
		available_scenarios=list_available_scenarios();
		
		scenario_picker_element = document.getElementById("scenario_picker");
		
		scenario_numbers=[]
				
		for (i = 0; i < scenario_data_JSON.nodes.length; i++) {
			x=[];
			x[0] =i;
			x[1]= scenario_data_JSON.nodes[i].data.id;
			scenario_numbers[i]=x;
		}
		
		scenario_numbers = scenario_numbers.sort(function(a,b) {return a[1] - b[1];});
		
		
		
	
			
		for (i = 0; i < scenario_data_JSON.nodes.length; i++) {
			
			option = document.createElement("option");
  			option.text = scenario_data_JSON.nodes[scenario_numbers[i][0]].data.name;
			option.value = scenario_data_JSON.nodes[scenario_numbers[i][0]].data.id;
		
			scenario_picker_element.add(option);	
			
		}
	
		
		
		
	}
	
	
	
	list_available_scenarios = function(){
		available_scenarios=[];
		
		if (localStorage.hasOwnProperty('gloomhavenScenarioTree') == true){
			scenario_info = JSON.parse(localStorage.getItem("gloomhavenScenarioTree"));			
			for (i = 0; i < scenario_info.nodes.length; i++) {
				if (scenario_info.nodes[i].status == "attempted" || scenario_info.nodes[i].status =="incomplete"){
					//available_scenarios.push(scenario_info.nodes[i].id);
					available_scenarios.push(i);
				}
			}
		}
		else{
			available_scenarios =[1];
		}
		console.log(available_scenarios);
		console.log("available_scenarios");
		return available_scenarios;	
	}

}

