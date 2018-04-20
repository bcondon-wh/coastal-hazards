package gov.usgs.cida.coastalhazards.rest.data.util;

import gov.usgs.cida.coastalhazards.model.Item;
import gov.usgs.cida.coastalhazards.model.util.ItemLastUpdateComparator;
import java.util.Arrays;
import java.util.List;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class ItemUtil {

	private static final int MAX_DEPTH = 20;
	private static final ItemLastUpdateComparator updateComparator = new ItemLastUpdateComparator();

	/**
	 * Gathers the attributes of all items below this one in the "tree"
	 *
	 * @param item Item to traverse
	 * @return SortedSet of attribute names (sorted for peeking at first item)
	 */
	public static SortedSet<String> gatherAttributes(Item item) {
		return gatherAttributes(item, 0);
	}

	/**
	 * Protects against cycles (though they shouldn't exist (fingers crossed))
	 */
	private static SortedSet<String> gatherAttributes(Item item, int depth) {
		SortedSet<String> attrs = new TreeSet<>();
		if (item != null && depth < MAX_DEPTH) {
			Item.ItemType type = item.getItemType();
			if (type == Item.ItemType.data) {
				attrs.add(item.getAttr());
			}
			else if (type == Item.ItemType.aggregation || type == Item.ItemType.uber
					|| type == Item.ItemType.template) {
				List<Item> children = item.getChildren();
				for (Item child : children) {
					attrs.addAll(gatherAttributes(child, depth + 1));
				}
			}
		}
		return attrs;
	}

	public static Item gatherNewest(Item item) {
		return gatherNewest(item, 0);
	}

	public static Item gatherNewest(List<Item> items) {
		Item newest = null;
		if (items != null) {
			for (Item item : items) {
				Item localNewest = gatherNewest(item);
				if (newest == null || updateComparator.compare(localNewest, newest) > 0) {
					newest = localNewest;
				}
			}
		}
		return newest;
	}

	private static Item gatherNewest(Item item, int depth) {
		Item newest = item;
		if (item != null && depth < MAX_DEPTH) {
			Item.ItemType type = item.getItemType();
			if (type == Item.ItemType.aggregation || type == Item.ItemType.uber
					|| type == Item.ItemType.template) {
				List<Item> children = item.getChildren();
				if (children != null) {
					for (Item child : children) {
						Item newestChild = gatherNewest(child, depth + 1);
						if (updateComparator.compare(newestChild, item) > 0) {
							newest = newestChild;
						}
					}
				}
			}
		}
		return newest;
	}

	/**
	 * Removes the orphan from the children of the ancestors
	 * @param itemToOrphan
	 * @param ancestors
	 * @return List of ancestors that no longer have itemToOrphan as a child
	 */
	public static List<Item> stripOrphanFromAncestors(Item itemToOrphan, List<Item> ancestors) {
		List<Item> ancestorsWithoutOrphan = ancestors.stream().map((ancestor) -> {
			List<Item> children = ancestor.getChildren();
			if (null != children) {
				children.removeAll(Arrays.asList(itemToOrphan));
				ancestor.setChildren(children);
			}
			return ancestor;
		}).collect(Collectors.toList());
		return ancestorsWithoutOrphan;
	}
}
