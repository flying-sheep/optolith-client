import * as React from 'react';
import { ActivatableAddList } from '../../components/ActivatableAddList';
import { ActivateArgs, ActiveViewObject, DeactiveViewObject, Instance, UIMessages } from '../../types/data';

export interface DeactiveListProps {
  activeList?: ActiveViewObject[];
  list: DeactiveViewObject[];
  locale: UIMessages;
  rating: { [id: string]: string };
  showRating: boolean;
  get(id: string): Instance | undefined;
  addToList(args: ActivateArgs): void;
  selectForInfo(id: string): void;
}

export function DeactiveList(props: DeactiveListProps) {
  return (
    <ActivatableAddList {...props} hideGroup />
  );
}
