import * as React from 'react';
import { Tab } from '../../components/Tab';
import { SubTab } from '../../types/data.d';
import { TabId } from '../../utils/LocationUtils';

export interface NavigationBarSubTabsProps {
	currentTab: string;
	tabs: SubTab[];
	setTab(tab: TabId): void;
}

export function NavigationBarSubTabs(props: NavigationBarSubTabsProps) {
	return (
		<div className="navigationbar-subtabs">
			{
				props.tabs.map(tab => {
					const { id, ...other } = tab;
					const isActive = props.currentTab === id;
					const set = () => props.setTab(id);
					return (
						<Tab
							{...other}
							key={id}
							active={isActive}
							onClick={set}
							/>
					);
				})
			}
		</div>
	);
}