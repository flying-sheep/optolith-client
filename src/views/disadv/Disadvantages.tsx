import * as ActivatableStore from '../../stores/ActivatableStore';
import * as Categories from '../../constants/Categories';
import * as DisAdvActions from '../../actions/DisAdvActions';
import * as React from 'react';
import BorderButton from '../../components/BorderButton';
import Checkbox from '../../components/Checkbox';
import CultureStore from '../../stores/CultureStore';
import DisAdvList from './DisAdvList';
import DisAdvStore from '../../stores/DisAdvStore';
import ProfessionStore from '../../stores/ProfessionStore';
import RaceStore from '../../stores/RaceStore';
import Slidein from '../../components/Slidein';
import TextField from '../../components/TextField';

interface State {
	filterText: string;
	showRating: boolean;
	disadvActive: ActiveViewObject[];
	disadvDeactive: DisadvantageInstance[];
	showAddSlidein: boolean;
	race: RaceInstance;
	culture: CultureInstance;
	profession: ProfessionInstance;
}

export default class Disadvantages extends React.Component<undefined, State> {
	state = {
		filterText: '',
		showRating: DisAdvStore.getRating(),
		disadvActive: ActivatableStore.getActiveForView(Categories.DISADVANTAGES),
		disadvDeactive: ActivatableStore.getDeactiveForView(Categories.DISADVANTAGES),
		showAddSlidein: false,
		race: RaceStore.getCurrent(),
		culture: CultureStore.getCurrent(),
		profession: ProfessionStore.getCurrent()
	};

	_updateDisAdvStore = () => this.setState({
		showRating: DisAdvStore.getRating(),
		disadvActive: ActivatableStore.getActiveForView(Categories.DISADVANTAGES),
		disadvDeactive: ActivatableStore.getDeactiveForView(Categories.DISADVANTAGES)
	} as State);

	filter = (event: InputTextEvent) => this.setState({ filterText: event.target.value } as State);
	changeRating = () => DisAdvActions.switchRatingVisibility();
	showAddSlidein = () => this.setState({ showAddSlidein: true } as State);
	hideAddSlidein = () => this.setState({ showAddSlidein: false } as State);

	componentDidMount() {
		DisAdvStore.addChangeListener(this._updateDisAdvStore );
	}

	componentWillUnmount() {
		DisAdvStore.removeChangeListener(this._updateDisAdvStore );
	}

	render() {

		const rating: { [id: string]: 'IMP' | 'TYP' | 'UNTYP' } = {};
		const { race, culture, profession } = this.state;

		const IMP = 'IMP';
		const TYP = 'TYP';
		const UNTYP = 'UNTYP';

		race.typicalDisadvantages.forEach(e => { rating[e] = TYP; });
		race.untypicalDisadvantages.forEach(e => { rating[e] = UNTYP; });
		culture.typicalDisadvantages.forEach(e => { rating[e] = TYP; });
		culture.untypicalDisadvantages.forEach(e => { rating[e] = UNTYP; });
		profession.typicalDisadvantages.forEach(e => { rating[e] = TYP; });
		profession.untypicalDisadvantages.forEach(e => { rating[e] = UNTYP; });
		race.importantDisadvantages.forEach(e => { rating[e[0]] = IMP; });

		return (
			<div className="page" id="advantages">
				<Slidein isOpen={this.state.showAddSlidein} close={this.hideAddSlidein}>
					<div className="options">
						<TextField hint="Suchen" value={this.state.filterText} onChange={this.filter} fullWidth />
						<Checkbox checked={this.state.showRating} onClick={this.changeRating}>Wertung durch Spezies, Kultur und Profession anzeigen</Checkbox>
					</div>
					<DisAdvList list={this.state.disadvDeactive} type="DISADV" rating={rating} showRating={this.state.showRating} phase={2} />
				</Slidein>
				<div className="options">
					<TextField hint="Suchen" value={this.state.filterText} onChange={this.filter} fullWidth />
					<BorderButton label="Hinzufügen" onClick={this.showAddSlidein} />
				</div>
				<DisAdvList list={this.state.disadvActive} type="DISADV" rating={rating} showRating={this.state.showRating} active phase={2} />
			</div>
		);
	}
}