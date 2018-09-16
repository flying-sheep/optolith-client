import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import * as EquipmentActions from '../actions/EquipmentActions';
import { AppState } from '../reducers/appReducer';
import { getInitialStartingWealth } from '../selectors/activatableSelectors';
import { getCarryingCapacity } from '../selectors/attributeSelectors';
import { getAllCombatTechniques } from '../selectors/combatTechniquesSelectors';
import { getStartEl } from '../selectors/elSelectors';
import { getFilteredItems, getFilteredItemTemplates, getPurse, getTotalPrice, getTotalWeight } from '../selectors/equipmentSelectors';
import { getAttributes, getEquipmentFilterText, getItemTemplatesFilterText, getTotalAdventurePoints } from '../selectors/stateSelectors';
import { getEquipmentSortOrder, getMeleeItemTemplateCombatTechniqueFilter, getRangedItemTemplateCombatTechniqueFilter } from '../selectors/uisettingsSelectors';
import { Equipment, EquipmentDispatchProps, EquipmentOwnProps, EquipmentStateProps } from '../views/belongings/Equipment';

function mapStateToProps(state: AppState) {
  return {
    attributes: getAttributes(state),
    combatTechniques: getAllCombatTechniques(state),
    carryingCapacity: getCarryingCapacity(state),
    initialStartingWealth: getInitialStartingWealth(state),
    items: getFilteredItems(state),
    hasNoAddedAP: getTotalAdventurePoints(state) === getStartEl(state).ap,
    purse: getPurse(state),
    sortOrder: getEquipmentSortOrder(state),
    templates: getFilteredItemTemplates(state),
    totalPrice: getTotalPrice(state),
    totalWeight: getTotalWeight(state),
    meleeItemTemplateCombatTechniqueFilter: getMeleeItemTemplateCombatTechniqueFilter(state),
    rangedItemTemplateCombatTechniqueFilter: getRangedItemTemplateCombatTechniqueFilter(state),
    filterText: getEquipmentFilterText(state),
    templatesFilterText: getItemTemplatesFilterText(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
  return {
    addTemplateToList(id: string): void {
      dispatch(EquipmentActions.addTemplateToList(id));
    },
    createItem(): void {
      dispatch(EquipmentActions.createItem());
    },
    editItem(id: string): void {
      dispatch(EquipmentActions.editItem(id));
    },
    deleteItem(id: string) {
      dispatch(EquipmentActions._removeFromList(id));
    },
    setSortOrder(option: string) {
      dispatch(EquipmentActions._setSortOrder(option));
    },
    setDucates(value: string) {
      dispatch(EquipmentActions._setDucates(value));
    },
    setSilverthalers(value: string) {
      dispatch(EquipmentActions._setSilverthalers(value));
    },
    setHellers(value: string) {
      dispatch(EquipmentActions._setHellers(value));
    },
    setKreutzers(value: string) {
      dispatch(EquipmentActions._setKreutzers(value));
    },
    setMeleeItemTemplatesCombatTechniqueFilter(filterOption: string | undefined) {
      dispatch(EquipmentActions.setMeleeItemTemplatesCombatTechniqueFilter(filterOption));
    },
    setRangedItemTemplatesCombatTechniqueFilter(filterOption: string | undefined) {
      dispatch(EquipmentActions.setRangedItemTemplatesCombatTechniqueFilter(filterOption));
    },
    setFilterText(filterText: string) {
      dispatch(EquipmentActions.setEquipmentFilterText(filterText));
    },
    setTemplatesFilterText(filterText: string) {
      dispatch(EquipmentActions.setItemTemplatesFilterText(filterText));
    },
  };
}

export const EquipmentContainer = connect<EquipmentStateProps, EquipmentDispatchProps, EquipmentOwnProps>(mapStateToProps, mapDispatchToProps)(Equipment);
