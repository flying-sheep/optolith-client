import * as React from 'react';
import { Checkbox } from '../../components/Checkbox';
import { Dialog, DialogProps } from '../../components/DialogNew';
import { Dropdown } from '../../components/Dropdown';
import { Hr } from '../../components/Hr';
import { Option } from '../../components/RadioButtonGroup';
import { Scroll } from '../../components/Scroll';
import { SegmentedControls } from '../../components/SegmentedControls';
import { TextField } from '../../components/TextField';
import { InputTextEvent } from '../../types/data';
import { UIMessagesObject } from '../../types/ui';
import { Book, ExperienceLevel } from '../../types/wiki';
import { Just, List, Maybe, Nothing, OrderedMap, OrderedSet, Record } from '../../utils/dataUtils';
import { translate } from '../../utils/I18n';

export interface HeroCreationProps extends DialogProps {
  locale: UIMessagesObject;
  experienceLevels: OrderedMap<string, Record<ExperienceLevel>>;
  sortedBooks: List<Record<Book>>;
  close (): void;
  createHero (
    name: string,
    sex: 'm' | 'f',
    el: string,
    enableAllRuleBooks: boolean,
    enabledRuleBooks: OrderedSet<string>
  ): void;
}

export interface HeroCreationState {
  name: string;
  gender: Maybe<'m' | 'f'>;
  el: Maybe<string>;
  enableAllRuleBooks: boolean;
  enabledRuleBooks: OrderedSet<string>;
}

export class HeroCreation extends React.Component<HeroCreationProps, HeroCreationState> {
  state: HeroCreationState = {
    name: '',
    enableAllRuleBooks: false,
    enabledRuleBooks: OrderedSet.empty (),
    gender: Nothing (),
    el: Nothing ()
  };

  changeName = (event: InputTextEvent) => this.setState (() => ({ name: event.target.value }));
  changeGender = (gender: string) => this.setState (() => ({ gender }));
  changeEL = (el: Maybe<string>) => this.setState (() => ({ el }));
  create = () => {
    const { name, gender, el, enableAllRuleBooks, enabledRuleBooks } = this.state;

    if (name.length > 0 && Maybe.isJust (gender) && Maybe.isJust (el)) {
      this.props.createHero (
        name,
        Maybe.fromJust (gender),
        Maybe.fromJust (el),
        enableAllRuleBooks,
        enabledRuleBooks
      );
    }
  }

  clear = () => this.setState (() => ({ name: '', gender: Nothing (), el: Nothing () }));

  close = () => {
    this.props.close ();
    this.clear ();
  }

  switchEnableAllRuleBooks = (): void => {
    this.setState (prevState => ({ enableAllRuleBooks: !prevState.enableAllRuleBooks }));
  }

  switchEnableRuleBook = (id: string): void => {
    const { enabledRuleBooks } = this.state;

    this.setState (
      () => ({
        enabledRuleBooks: enabledRuleBooks .member (id)
          ? enabledRuleBooks .delete (id)
          : enabledRuleBooks .insert (id)
      })
    );
  }

  componentWillReceiveProps (nextProps: HeroCreationProps) {
    if (nextProps.isOpened === false && this.props.isOpened === true) {
      this.clear ();
    }
  }

  render () {
    const { experienceLevels: experienceLevelsMap, locale, sortedBooks, ...other } = this.props;
    const { enableAllRuleBooks, enabledRuleBooks } = this.state;

    const experienceLevels = experienceLevelsMap
      .elems ()
      .map (e => ({ id: e.lookup ('id'), name: `${e.get ('name')} (${e.get ('ap')} AP)` }));

    return (
      <Dialog
        {...other}
        id="herocreation"
        title={translate (locale, 'herocreation.title')}
        close={this.close}
        buttons={[
          {
            disabled: this.state.name === '' || !this.state.gender || !this.state.el,
            label: translate (locale, 'herocreation.actions.start'),
            onClick: this.create,
            primary: true,
          },
        ]}
        >
        <TextField
          hint={translate (locale, 'herocreation.options.nameofhero')}
          value={this.state.name}
          onChange={this.changeName}
          fullWidth
          autoFocus
          />
        <SegmentedControls
          active={this.state.gender}
          onClick={this.changeGender}
          options={List.of<Option<Maybe<'m' | 'f'>>> (
            {
              value: Just<'m'> ('m'),
              name: translate (locale, 'herocreation.options.selectsex.male')
            },
            {
              value: Just<'f'> ('f'),
              name: translate (locale, 'herocreation.options.selectsex.female')
            }
          )}
          />
        <Dropdown
          value={this.state.el}
          onChange={this.changeEL}
          options={experienceLevels}
          hint={translate (locale, 'herocreation.options.selectexperiencelevel')}
          fullWidth
          />
        <Hr/>
        <Scroll>
          <Checkbox
            checked={enableAllRuleBooks === true}
            onClick={this.switchEnableAllRuleBooks}
            label={translate (locale, 'rules.enableallrulebooks')}
            />
          {sortedBooks.map (e => {
            const isCore = ['US25001', 'US25002'].includes (e .get ('id'));

            return (
              <Checkbox
                key={e.get ('id')}
                checked={enableAllRuleBooks || enabledRuleBooks.member (e .get ('id')) || isCore}
                onClick={() => this.switchEnableRuleBook (e .get ('id'))}
                label={e .get ('name')}
                disabled={enableAllRuleBooks === true || isCore}
                />
            );
          })}
        </Scroll>
      </Dialog>
    );
  }
}
