import React, { useEffect, useState } from 'react';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import {
    Card,
    Col,
    Drawer,
    Form,
    Input,
    Layout,
    PageHeader,
    Row,
    Select,
    Spin,
    Switch,
    Statistic,
    Dropdown,
    Menu,
    Pagination,
    Popover,
    Badge,
    List,
    Divider,
    Avatar
} from 'antd';
import useSWR, { mutate } from 'swr';
import { Button, Space, Typography } from 'antd';
import Meta from 'antd/lib/card/Meta';
import DownloadOutlined from '@ant-design/icons/lib/icons/DownloadOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import ReloadOutlined from '@ant-design/icons/lib/icons/ReloadOutlined';
import FilterOutlined from '@ant-design/icons/lib/icons/FilterOutlined';
import BellOutlined from '@ant-design/icons/lib/icons/BellOutlined';
import { find } from 'underscore';
const { Content } = Layout;
const { Option } = Select;
const { Text } = Typography;
const proxyBaseUrl: string = 'https://thingproxy.freeboard.io/fetch/';

export interface IProject {
    Name: string;
    PolicyId: string;
    ToolsIdentifier: string;
    TraitProperty: string;
    Verified: boolean;
}
type ProjectProps = {
    project: IProject;
};

type RequestFilter = {
    priceMax: number | null;
    priceMin: number | null;
    rankMax: number | null;
    rankMin: number | null;
    traits?: string | undefined;
};

export const Project = (props: ProjectProps) => {
    const [loading, setLoading] = useState(true);

    const [allItems, setAllItems] = useState<any[]>([]);

    // Todo: Pagination page
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Todo: page to fetch
    const [requestPage, setRequestPage] = useState<number>(1);

    const [listings, setListings] = useState<any[]>([]);
    const [totalListings, setTotalListings] = useState(0);

    const [floor, setFloor] = useState(0);
    const [toolsOnline, setToolsOnline] = useState(false);
    const [hasRarityFile, setHasRarityFile] = useState(false);
    const [mintCount, setMintCount] = useState(0);
    const [totalToolPages, setTotalToolPages] = useState(0);
    const [currentToolPage, setCurrentToolPage] = useState(0);
    const [isFetchingTools, setIsFetchingTools] = useState(false);
    const [rarityData, setRarityData] = useState<any[]>([]);

    const [project, setProject] = useState<IProject>(props.project);
    const [filterOpen, setFilterOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [enableNotification, setEnableNotification] = useState(false);
    const [pollListings, setPollListings] = useState<boolean>(false);

    const [priceMax, setPriceMax] = useState<number | null>(null);
    const [priceMin, setPriceMin] = useState<number | null>(null);
    const [rankMin, setRankMin] = useState<number | null>(null);
    const [rankMax, setRankMax] = useState<number | null>(null);

    const [notifyRankMax, setNotifyRankMax] = useState<number | null>(null);
    const [notifyPriceMax, setNotifyPriceMax] = useState<number | null>(null);

    const [requestFilter, setRequestFilter] = useState<RequestFilter | undefined>();
    const [requestSort, setRequestSort] = useState<any | undefined>({ _id: -1 });
    const [selectedSorting, setSelectedSorting] = useState<string>('recent');
    const [traitsFilter, setTraitsFilter] = useState<string | undefined>();
    const [fetchAllPages, setFetchAllPages] = useState<boolean>();

    useEffect(() => {
        if (props.project) {
            setLoading(true);
            const _project = props.project;
            setProject(_project);

            setFloor(0);
            setToolsOnline(false);
            setMintCount(0);
            setRequestPage(1);
            setRarityData([]);
            setHasRarityFile(false);
            const getRarityFile = async (project: IProject) => {
                const toolsData: any[] = await fetch('rarities/' + project.ToolsIdentifier + '.json', {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    }
                })
                    .then(function (response) {
                        return response.json();
                    })
                    .catch(() => {
                        fetchRarities(_project);
                    });

                if (toolsData && toolsData.length > 0) {
                    setToolsOnline(true);
                    setMintCount(toolsData?.length);
                    setRarityData(toolsData);
                    setHasRarityFile(true);
                }
            };
            getRarityFile(_project);
        }
    }, [props.project]);

    const push = async (entries: any[]) => {
        for (const entry of entries) {
            let rank = 0;
            if (!entry.rarityRank || entry.rarityRank.toLowerCase() === 'n/a' || entry.rarityRank.toLowerCase() === 'coming soon') {
                console.log('fetch n/a rank', entry);
                const toolsApiUrl = proxyBaseUrl + `https://cnft.tools/project/${project.ToolsIdentifier}/${entry.assetName}`;
                const result = await fetch(toolsApiUrl)
                    .then((res) => res.json())
                    .catch((err) => {
                        // throw err;
                    });

                if (result) {
                    console.log(result);
                    rank = parseInt(result.rarityRank);
                }
            }

            const item = {
                name: entry.assetName,
                serial: entry.assetID,
                score: parseInt(entry.rarityScore),
                rank: rank > 0 ? rank : parseInt(entry.rarityRank)
            };
            setRarityData((prev) => {
                return [...prev, item];
            });
        }
    };

    const { data, error } = useSWR(
        ['list_' + project.ToolsIdentifier, requestPage, requestFilter, requestSort],
        async (url: string) => {
            return await fetch('https://api.cnft.io/market/listings', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    search: project.PolicyId ? project.PolicyId : '',
                    sort: requestSort,
                    page: requestPage,
                    priceMax: ((requestFilter && requestFilter.priceMax) || 0) > 0 ? (requestFilter?.priceMax || 0) * 1000000 : null,
                    priceMin: ((requestFilter && requestFilter.priceMin) || 0) > 0 ? (requestFilter?.priceMin || 0) * 1000000 : null,
                    sold: false,
                    nsfw: false,
                    types: ['listing', 'offer'],
                    verified: project.Verified === true ? true : false,
                    project: project.Verified ? project.Name : null
                })
            }).then((res) => {
                return res.json();
            });
        },
        {
            refreshInterval: pollListings ? 100 : undefined,
            refreshWhenHidden: pollListings ? true : false,
            refreshWhenOffline: pollListings ? true : false
        }
    );

    const { data: floorData, error: floorError } = useSWR(
        'floor_' + project.ToolsIdentifier,
        async (url: string) => {
            return await fetch('https://api.cnft.io/market/listings', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    search: project.PolicyId ? project.PolicyId : '',
                    sort: { price: 1 },
                    page: 1,
                    sold: false,
                    nsfw: false,
                    types: ['listing', 'offer'],
                    verified: project.Verified === true ? true : false,
                    project: project.Verified ? project.Name : null
                })
            }).then((res) => res.json());
        },
        {
            refreshInterval: pollListings ? 10000 : undefined,
            refreshWhenHidden: pollListings ? true : false,
            refreshWhenOffline: pollListings ? true : false
        }
    );

    const refetchRarities = async () => {
        setRarityData([]);
        setHasRarityFile(false);
        await fetchRarities(project);
    };

    const fetchRarities = async (_project: IProject | undefined) => {
        const proj = _project || project;
        var myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        var raw = {
            sort: 'asc',
            method: 'rarity',
            page: 1,
            priceOnly: false,
            filters: {},
            sliders: {
                minPrice: 0,
                maxPrice: 0,
                minRank: 0,
                maxRank: 0
            }
        };
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(raw)
        } as any;
        const toolsApiUrl = proxyBaseUrl + `https://cnft.tools/project/${proj.ToolsIdentifier}`;
        const result = await fetch(toolsApiUrl, requestOptions)
            .then((res) => res.json())
            .catch((err) => {
                // throw err;
            });

        if (!result) return;

        setToolsOnline(true);
        setIsFetchingTools(true);
        const maxPages = result.params.maxPages;
        setTotalToolPages(maxPages);
        setMintCount(result.params.totalResults);
        push(result.stats);
        for (let i = 2; i < maxPages + 2; i++) {
            setCurrentToolPage(i);
            raw.page = i;
            const resPaged = await fetch(toolsApiUrl, {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(raw)
            }).then((res) => res.json());
            push(resPaged.stats);
        }
        setIsFetchingTools(false);
    };
    useEffect(() => {
        if (data && !error) {
            const items: any[] = data.results.map((item: any) => {
                var price = item.price / 1000000;
                item.price = price;
                item.img = item.asset.metadata?.image;

                const traits = project.TraitProperty ? item.asset.metadata[project.TraitProperty] : item.asset.metadata;
                item.traitString = objToString(traits);
                let rarityItem = (rarityData || []).find((x) => x.name === item.asset.assetId);
                if (rarityItem) {
                    item.rank = rarityItem.rank;
                    item.serial = rarityItem.serial;
                }

                if (price <= (notifyPriceMax || 0) && item.rank <= (notifyRankMax || 0)) {
                    let notifications: any[] = JSON.parse(localStorage.getItem(project.Name.replace(' ', '') + '_notifications') || '[]');
                    let isNotified: boolean = false;
                    if (notifications && notifications.length > 0) {
                        let notification = find(notifications, (noti: any) => {
                            return noti.assetId === item.asset.assetId;
                        });
                        isNotified = notification !== undefined;
                    }

                    if (!isNotified) {
                        let icon = item.serial
                            ? 'https://cnft.tools/static/assets/projectthumbs/' + project.ToolsIdentifier + '/' + item.serial + '.png'
                            : "https://ipfs.blockfrost.dev/ipfs/' + item.img.replace('ipfs://', '')";
                        var options: NotificationOptions = {
                            body: 'Rank: ' + item.rank + ' Price: ' + price,
                            icon: icon + '?auto=compress&cs=tinysrgb&dpr=1&w=500',
                            dir: 'ltr'
                        };
                        localStorage.setItem(
                            project.Name.replace(' ', '') + '_notifications',
                            JSON.stringify(notifications.length > 0 ? [...notifications, { ...item, ...item.asset }] : [{ ...item, ...item.asset }])
                        );

                        if (enableNotification && price > 0) {
                            var notification = new Notification('SNIPE -> ' + item.asset.metadata['name'], options);
                            notification.onclick = (event: any) => {
                                event.preventDefault();
                                window.open('https://cnft.io/token/' + item._id);
                            };
                        }
                    }
                }

                return { ...item, ...item.asset };
            });

            // const maxPages = 5;
            const maxPages = parseInt(Number((data.count / 24).toFixed(1)).toFixed(0));
            if (fetchAllPages) {
                if (requestPage <= maxPages && items.length > 0) {
                    setLoading(true);
                    setRequestPage((page) => {
                        return page + 1;
                    });
                    setAllItems((_items) => {
                        return [..._items, ...items];
                    });

                    if (requestPage === maxPages) {
                        const filtered = applyFilters(allItems);
                        setLoading(false);
                        // setListings(currentTodos);

                        function compareIndexFound(a: any, b: any) {
                            if (a.rank < b.rank) {
                                return -1;
                            }
                            if (a.rank > b.rank) {
                                return 1;
                            }
                            return 0;
                        }
                        // function compareIndexFound(a: any, b: any) {
                        //     if (a.price < b.price) {
                        //         return -1;
                        //     }
                        //     if (a.price > b.price) {
                        //         return 1;
                        //     }
                        //     return 0;
                        // }
                        const q = filtered.sort(compareIndexFound);

                        const indexOfLastTodo = 1 * 24;
                        const indexOfFirstTodo = indexOfLastTodo - 24;
                        const currentTodos = q.slice(indexOfFirstTodo, indexOfLastTodo);

                        setListings(currentTodos);
                        setTotalListings(filtered.length);
                    }
                }
            } else if (!fetchAllPages) {
                const filtered = applyFilters(items);
                setTotalListings(data.count);
                setListings(filtered);
                setLoading(false);
            }
        }
    }, [data]);

    const applyFilters = (items: any[]): any[] => {
        let _filtered: any[] = [];
        if (requestFilter) {
            if (requestFilter.traits && requestFilter.traits.length > 0) {
                const filtered = items.filter((x: any) => {
                    const selectedTraits = requestFilter.traits?.split(',');
                    return (selectedTraits || []).some((v: string) => x.traitString.toLowerCase().includes(v.toLowerCase()));
                });
                _filtered = filtered;
            }
            if (requestFilter.rankMin !== null && requestFilter.rankMin > 0) {
                _filtered = items.filter((x: any) => {
                    return x.rank >= (requestFilter.rankMin || 0);
                });
            }
            if (requestFilter.rankMax && requestFilter.rankMax > 0) {
                _filtered = items.filter((x: any) => {
                    return x.rank <= (requestFilter.rankMax || 0);
                });
            }
            if (requestFilter.priceMin !== null && requestFilter.priceMin > 0) {
                _filtered = items.filter((x: any) => {
                    return x.price >= (requestFilter.priceMin || 0);
                });
            }
            if (requestFilter.priceMax !== null && requestFilter.priceMax > 0) {
                _filtered = items.filter((x: any) => {
                    return x.price <= (requestFilter.priceMax || 0);
                });
            }
            return _filtered;
        }
        return items;
    };

    const objToString = (obj: any) => {
        return Object.entries(obj).reduce((str: any, [p, val]) => {
            return `${str}${p}:${val}\n`;
        }, '');
    };

    useEffect(() => {
        if (floorData && !floorError) {
            const floorItem = floorData?.results[0];
            const floorPrice = floorItem?.price / 1000000;
            if (floorPrice) setFloor(floorPrice);
        }
    }, [floorData]);
    return (
        <>
            <div className="site-layout-background" style={{ padding: 4, textAlign: 'center' }}>
                <>
                    <Drawer
                        title="Settings"
                        width={350}
                        onClose={() => setSettingsOpen(false)}
                        visible={settingsOpen}
                        bodyStyle={{ paddingBottom: 80 }}>
                        <Form layout="vertical" hideRequiredMark>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="autoPoll" label="Poll listings">
                                        <Switch
                                            onChange={(checked) => {
                                                setPollListings(checked);
                                            }}
                                            checkedChildren="Yes"
                                            unCheckedChildren="No"
                                            size="default"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                        <Button
                            block
                            style={{ marginBottom: '10px' }}
                            onClick={() => {
                                setSettingsOpen(false);
                            }}>
                            Clear
                        </Button>
                        <Button
                            block
                            type="primary"
                            onClick={() => {
                                setSettingsOpen(false);
                            }}>
                            Save
                        </Button>
                    </Drawer>
                    <Drawer title="Filter" width={350} onClose={() => setFilterOpen(false)} visible={filterOpen} bodyStyle={{ paddingBottom: 80 }}>
                        <Form layout="vertical" hideRequiredMark>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="minPrice" label="Min. price">
                                        <Input
                                            placeholder="Min price"
                                            value={priceMin || 0}
                                            onChange={(e: any) => setPriceMin(parseInt(e.target.value))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="maxPrice" label="Max. price">
                                        <Input
                                            placeholder="Max price"
                                            value={priceMax || 0}
                                            onChange={(e: any) => setPriceMax(parseInt(e.target.value))}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="minRank" label="Min. rank">
                                        <Input placeholder="Min rank" value={rankMin || 0} onChange={(e) => setRankMin(parseInt(e.target.value))} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="maxRank" label="Max. rank">
                                        <Input placeholder="Max rank" value={rankMax || 0} onChange={(e) => setRankMax(parseInt(e.target.value))} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="traits" label="Traits">
                                        <Input.TextArea
                                            rows={4}
                                            value={traitsFilter}
                                            onChange={(e) => {
                                                setTraitsFilter(e.target.value);
                                            }}
                                            placeholder="Traits"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="fetchAll" label="Fetch all pages">
                                        <Switch
                                            onChange={(checked) => {
                                                setFetchAllPages(checked);
                                            }}
                                            checked={fetchAllPages}
                                            checkedChildren="Yes"
                                            unCheckedChildren="No"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                        <Button
                            block
                            style={{ marginBottom: '10px' }}
                            onClick={() => {
                                setRequestFilter(undefined);
                                setFilterOpen(false);

                                setTraitsFilter(undefined);
                                setPriceMax(null);
                                setPriceMin(null);
                                setRankMin(null);
                                setRankMax(null);
                                setFetchAllPages(false);
                            }}>
                            Clear
                        </Button>
                        <Button
                            block
                            type="primary"
                            onClick={() => {
                                setFilterOpen(false);
                                setRequestFilter({
                                    priceMax: priceMax,
                                    priceMin: priceMin,
                                    traits: traitsFilter,
                                    rankMin: rankMin,
                                    rankMax: rankMax
                                });
                            }}>
                            Apply
                        </Button>
                    </Drawer>
                    <div className="site-page-header-ghost-wrapper">
                        <PageHeader
                            style={{ padding: '4px 8px' }}
                            ghost={false}
                            title={
                                <Row gutter={4}>
                                    <Col>
                                        <Dropdown.Button
                                            overlay={() => {
                                                return (
                                                    <Menu onClick={() => {}}>
                                                        <Menu.Item key="1">
                                                            <Button
                                                                block
                                                                icon={<ReloadOutlined />}
                                                                onClick={async () => {
                                                                    await refetchRarities();
                                                                }}>
                                                                Refetch tools
                                                            </Button>
                                                        </Menu.Item>
                                                        <Menu.Item key="2">
                                                            <Button
                                                                block
                                                                icon={<DownloadOutlined />}
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(JSON.stringify(rarityData));
                                                                    alert('Copied to clipboard!');
                                                                }}>
                                                                Copy
                                                            </Button>
                                                        </Menu.Item>
                                                    </Menu>
                                                );
                                            }}>
                                            {isFetchingTools && currentToolPage !== totalToolPages ? (
                                                <span>
                                                    ... {currentToolPage} / {totalToolPages}
                                                </span>
                                            ) : (
                                                'Tools'
                                            )}
                                            <span style={{ marginTop: '1px', marginLeft: '10px' }}>
                                                {toolsOnline ? (
                                                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                                                ) : (
                                                    <CloseCircleTwoTone twoToneColor="#eb2f96" />
                                                )}
                                            </span>
                                        </Dropdown.Button>
                                    </Col>
                                </Row>
                            }
                            extra={[
                                <Select
                                    value={selectedSorting}
                                    onChange={(selected) => {
                                        setLoading(true);
                                        if (selected === 'recent') {
                                            setRequestSort({ _id: -1 });
                                        } else if (selected === 'priceLowHigh') {
                                            setRequestSort({ price: 1 });
                                        } else if (selected === 'priceHighLow') {
                                            setRequestSort({ price: -1 });
                                        } else if (selected === 'rankLowHigh') {
                                        } else if (selected === 'rankHighLow') {
                                        }

                                        setSelectedSorting(selected);
                                    }}>
                                    <Option key={1} value={'recent'}>
                                        Recently listed
                                    </Option>
                                    <Option key={2} value={'priceLowHigh'}>
                                        <strong>Price:</strong> Low to high
                                    </Option>
                                    <Option key={3} value={'priceHighLow'}>
                                        <strong>Price:</strong> High to low
                                    </Option>
                                    <Option key={4} value={'rankLowHigh'}>
                                        <strong>Rank:</strong> Low to high
                                    </Option>
                                    <Option key={5} value={'rankHighLow'}>
                                        <strong>Rank:</strong> High to low
                                    </Option>
                                </Select>,
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        setLoading(true);
                                        setRequestPage(1);
                                        await mutate(['list_' + project.ToolsIdentifier, requestPage, requestFilter, requestSort]);
                                    }}
                                    icon={<ReloadOutlined />}></Button>,
                                <Button type="primary" onClick={() => setSettingsOpen(true)} icon={<SettingOutlined />}></Button>,
                                <Button type="primary" onClick={() => setFilterOpen(true)} icon={<FilterOutlined />}></Button>,
                                <Popover
                                    content={() => {
                                        let notifications = JSON.parse(
                                            localStorage.getItem(project.Name.replace(' ', '') + '_notifications') || '[]'
                                        );

                                        return (
                                            <>
                                                <div style={{ width: '350px' }}>
                                                    <Divider orientation="left">Settings</Divider>
                                                    <Form layout="vertical" hideRequiredMark>
                                                        <Form.Item name="notify" label="Notification (Desktop)">
                                                            <Switch
                                                                onChange={(checked) => {
                                                                    setEnableNotification(checked);
                                                                }}
                                                                checked={enableNotification}
                                                                checkedChildren="Yes"
                                                                unCheckedChildren="No"
                                                            />
                                                        </Form.Item>
                                                        <Row gutter={12}>
                                                            <Col span={12}>
                                                                <Form.Item name="notifyPriceMax" label="Price max">
                                                                    <Input
                                                                        placeholder="Price max"
                                                                        value={notifyPriceMax || 0}
                                                                        onChange={(e) => setNotifyPriceMax(parseInt(e.target.value))}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={12}>
                                                                <Form.Item name="notifyRankMax" label="Rank max">
                                                                    <Input
                                                                        placeholder="Rank max"
                                                                        value={notifyRankMax || 0}
                                                                        onChange={(e) => setNotifyRankMax(parseInt(e.target.value))}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                    <Divider orientation="left">Notifications</Divider>
                                                    <List
                                                        size="small"
                                                        footer={
                                                            <div>
                                                                <Button
                                                                    type="primary"
                                                                    onClick={() => {
                                                                        localStorage.removeItem(project.Name.replace(' ', '') + '_notifications');
                                                                    }}>
                                                                    Clear
                                                                </Button>
                                                            </div>
                                                        }
                                                        bordered
                                                        dataSource={notifications}
                                                        renderItem={(item: any) => {
                                                            return (
                                                                <List.Item>
                                                                    <Row gutter={12}>
                                                                        <Col>
                                                                            {item.serial ? (
                                                                                <Avatar
                                                                                    size="small"
                                                                                    src={
                                                                                        'https://cnft.tools/static/assets/projectthumbs/' +
                                                                                        project.ToolsIdentifier +
                                                                                        '/' +
                                                                                        item.serial +
                                                                                        '.png'
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <Avatar
                                                                                    src={
                                                                                        'https://ipfs.blockfrost.dev/ipfs/' +
                                                                                        item.img?.replace('ipfs://', '')
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Col>
                                                                        <Col>{item.metadata['name']}</Col>
                                                                        <Col>
                                                                            <Button
                                                                                type="primary"
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    window.open(
                                                                                        'https://cnft.tools/' +
                                                                                            project.ToolsIdentifier +
                                                                                            '/' +
                                                                                            item.serial
                                                                                    );
                                                                                }}>
                                                                                Tools
                                                                            </Button>
                                                                        </Col>
                                                                        <Col>
                                                                            <Button
                                                                                type="primary"
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    window.open('https://cnft.io/token/' + item._id);
                                                                                }}>
                                                                                Buy
                                                                            </Button>
                                                                        </Col>
                                                                    </Row>
                                                                </List.Item>
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        );
                                    }}
                                    trigger="click">
                                    <Badge count={JSON.parse(localStorage.getItem(project.Name.replace(' ', '') + '_notifications') || '[]').length}>
                                        <Button type="primary" icon={<BellOutlined />} />
                                    </Badge>
                                </Popover>
                            ]}></PageHeader>
                    </div>
                </>
            </div>
            <Content style={{ margin: '10px 10px 0' }}>
                <div className="site-statistic-demo-card" style={{ marginBottom: '10px' }}>
                    <Row gutter={12}>
                        <Col xs={8} sm={8} md={6} lg={4} xl={4}>
                            <Card size="small">{loading ? <Spin size="small" /> : <Statistic title="Assets" value={totalListings} />}</Card>
                        </Col>
                        <Col xs={8} sm={8} md={6} lg={4} xl={4}>
                            <Card size="small">{loading ? <Spin size="small" /> : <Statistic title="Floor" prefix="₳" value={floor} />}</Card>
                        </Col>
                        <Col xs={8} sm={8} md={6} lg={4} xl={4}>
                            <Card size="small">{loading ? <Spin size="small" /> : <Statistic title="Circulation" value={mintCount} />}</Card>
                        </Col>
                    </Row>
                </div>
                <div className="" style={{ minHeight: 1024, textAlign: 'center' }}>
                    {loading ? (
                        <div
                            style={{
                                position: 'fixed',
                                top: '50%',
                                right: 0,
                                bottom: 0,
                                left: 0
                            }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            {listings && !error ? (
                                <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                                    {listings.map((item: any) => {
                                        return (
                                            <Col xs={8} sm={8} md={6} lg={4} xl={4} style={{ marginBottom: '12px' }}>
                                                <Card
                                                    // style={isSnipe ? { border: '5px solid red' } : {}}
                                                    size="small"
                                                    cover={
                                                        item.serial ? (
                                                            <img
                                                                src={
                                                                    'https://cnft.tools/static/assets/projectthumbs/' +
                                                                    project.ToolsIdentifier +
                                                                    '/' +
                                                                    item.serial +
                                                                    '.png'
                                                                }
                                                            />
                                                        ) : (
                                                            <img src={'https://ipfs.blockfrost.dev/ipfs/' + item.img.replace('ipfs://', '')} />
                                                        )
                                                    }
                                                    actions={[
                                                        <a target="_blank" href={'https://cnft.tools/' + project.ToolsIdentifier + '/' + item.serial}>
                                                            Tools
                                                        </a>,
                                                        <a target="_blank" href={'https://cnft.io/token/' + item._id}>
                                                            Buy
                                                        </a>
                                                    ]}>
                                                    <Meta
                                                        title={
                                                            <div style={{ fontSize: '13px' }}>
                                                                <Text ellipsis>{item.metadata['name']}</Text>
                                                            </div>
                                                        }
                                                        description={
                                                            <div style={{ color: 'black', fontSize: '13px' }}>
                                                                <Text ellipsis>
                                                                    <div style={{ marginBottom: '8px' }}>
                                                                        <strong>{item.rank}</strong> / {mintCount}
                                                                    </div>
                                                                </Text>

                                                                <div>
                                                                    <strong>{item.price} ₳</strong>
                                                                </div>
                                                                {/* <div>
                                                                    <Text code>{item.traitString}</Text>
                                                                </div> */}
                                                            </div>
                                                        }
                                                    />
                                                </Card>
                                            </Col>
                                        );
                                    })}

                                    <Col>
                                        <Pagination
                                            defaultCurrent={fetchAllPages ? currentPage : requestPage}
                                            onChange={async (_page: number, pageSize: number) => {
                                                setLoading(true);

                                                if (fetchAllPages) {
                                                    setCurrentPage(_page);
                                                } else {
                                                    setRequestPage(_page);
                                                }
                                            }}
                                            pageSize={24}
                                            total={totalListings}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                <>Loading...</>
                            )}
                        </>
                    )}
                </div>
            </Content>
        </>
    );
};
