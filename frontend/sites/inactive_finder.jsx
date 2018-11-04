import { h, render, Component } from 'preact';
import axios from 'axios';
import classNames from 'classnames';
import Input from '../components/input';
import { connect } from 'unistore/preact';
import { handle_response } from '../actions';
import InactiveTable from '../components/inactive_table';
import InfoTitle from '../components/info_title';

@connect('notifications', handle_response)
export default class InactiveFinder extends Component {
	state = {
		name: 'inactive finder',
		selected_farmlist: '',
		village_name: '',
		all_farmlists: [],
		all_villages: [],
		error_village: false,
		error_farmlist: false,
		max_player_pop: '',
		max_village_pop: '',
		max_distance: '',
		inactive_for: '',
		inactives: [],
		loading: false,
		message: ''
	}

	description = 'searches for inactive players and displays their villages based on distance. \
		once you added them to your farmlist, you can use the easy scout feature to spy them.';

	componentDidMount() {
		axios.get('/api/data?ident=villages').then(res => {
			this.setState({ all_villages: res.data, village_name: res.data[0].data.name });
		});

		axios.get('/api/data?ident=farmlists').then(res => this.setState({ all_farmlists: res.data }));
	}

	clicked = async item => {
		const { selected_farmlist } = this.state;

		this.setState({ 
			error_farmlist: (selected_farmlist == '')
		});

		if(this.state.error_farmlist) return false;

		this.setState({ error_farmlist: false });

		const payload = {
			action: 'toggle',
			data: {
				farmlist: selected_farmlist,
				village: item
			}
		};

		let response = await axios.post('/api/inactivefinder', payload);

		const { error } = response.data;

		if(error) {
			this.props.handle_response(response.data);
			return false;
		}

		return true;
	}

	search = async e => {
		if(this.state.loading) return;

		this.setState({ 
			error_village: (this.state.village_name == '')
		});

		if(this.state.error_village) return;

		this.setState({ loading: true, message: '', inactives: [] });

		const { 
			village_name,
			max_player_pop,
			max_village_pop,
			max_distance,
			inactive_for,
			selected_farmlist
		} = this.state;

		const payload_data = {
			village_name,
			max_distance,
			max_player_pop,
			max_village_pop,
			inactive_for,
			selected_farmlist
		};

		const payload = {
			action: 'get',
			data: payload_data
		};

		let response = await axios.post('/api/inactivefinder', payload);

		const { error, data, message } = response.data;

		this.setState({ inactives: [ ...data ], loading: false });

		if(error) {
			this.props.handle_response(response.data);
			return;
		}

		this.setState({ message });
	}

	render({}, { name, inactives, message, max_player_pop, max_village_pop, max_distance, inactive_for, loading }) {
		const { all_villages, all_farmlists, village_name, selected_farmlist } = this.state;

		const village_select_class = classNames({
			select: true,
			'is-danger': this.state.error_village
		});

		const farmlist_select_class = classNames({
			select: true,
			'is-danger': this.state.error_farmlist
		});

		const search_button = classNames({
			button: true,
			'is-success': true,
			'is-radiusless': true,
			'is-loading': loading
		});

		const villages = all_villages.map(village => <option value={ village.data.name }>{ village.data.name }</option>);
		const farmlist_opt = all_farmlists.map(farmlist => <option value={ farmlist.data.listName }>{ farmlist.data.listName }</option>);

		return (
			<div>
				<InfoTitle title={ name } description={ this.description } />

				<div className="columns">

					<div className="column">

						<div class="field">
							<label class="label">distance relative to</label>
							<div class="control">
								<div class={ village_select_class }>
									<select 
										class="is-radiusless"
										value={ village_name } 
										onChange={ (e) => this.setState({ village_name: e.target.value }) }
									>
										{ villages }
									</select>
								</div>
							</div>
						</div>

						<Input
							label='max player pop'
							placeholder='default: 500'
							value={ max_player_pop }
							onChange={ e => this.setState({ max_player_pop: e.target.value }) }
						/>

						<Input
							label='max village pop'
							placeholder='default: 200'
							value={ max_village_pop }
							onChange={ e => this.setState({ max_village_pop: e.target.value }) }
						/>

						<button className={ search_button } onClick={ this.search } style='margin-right: 1rem'>
							search
						</button>

					</div>
					<div className="column">

						<div class="field">
							<label class="label">add to farmlist</label>
							<div className="control">
								<div class={ farmlist_select_class }>
									<select 
										class="is-radiusless"
										value={ selected_farmlist }
										onChange={ e => this.setState({ selected_farmlist: e.target.value }) }
									>
										{ farmlist_opt }
									</select>
								</div>
							</div>
						</div>


						<Input
							label='max distance'
							placeholder='default: 100'
							value={ max_distance }
							onChange={ e => this.setState({ max_distance: e.target.value }) }
						/>

						<label class="label">inactive for</label>
						<div class="field has-addons">
							<p class="control">
								<input 
									class="input is-radiusless"
									type="text"
									placeholder="default: 5" 
									value={ inactive_for }
									onChange={ e => this.setState({ inactive_for: e.target.value }) }
								/>
							</p>
							<p class="control">
								<a class="button is-static is-radiusless">
									days
								</a>
							</p>
						</div>

						<div className="content" style='margin-top: 1.5rem' >
							{ message }
						</div>

					</div>

				</div>

				<InactiveTable content={ inactives } clicked={ this.clicked } />
			</div>
		);
}
}
