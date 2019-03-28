import { List } from "../../../Data/List";
import { fromDefault, makeLenses, Record } from "../../../Data/Record";
import { ActiveObjectWithId } from "../ActiveEntries/ActiveObjectWithId";
import { ActivatableCombinedName } from "./ActivatableCombinedName";

export interface ActivatableNameCost {
  naming: Record<ActivatableCombinedName>
  active: Record<ActiveObjectWithId>
  finalCost: number | List<number>
}

export interface ActivatableNameCostSafeCost extends ActivatableNameCost {
  finalCost: number
}

export const ActivatableNameCost =
  fromDefault<ActivatableNameCost> ({
    naming: ActivatableCombinedName.default,
    active: ActiveObjectWithId.default,
    finalCost: 0,
  })

export const ActivatableNameCostL = makeLenses (ActivatableNameCost)
