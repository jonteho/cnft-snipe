import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import './App.css';
import { Layout, Menu } from 'antd';
import { IProject, Project } from './components/Project';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

function App() {
    const [projects, setProjects] = useState<any[]>([]);
    const [currentProject, setCurrentProject] = useState<IProject>();

    const getProjects = async () => {
        const projects = await fetch('projects.json', {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        }).then(function (response) {
            return response.json();
        });
        setProjects(projects);
        setCurrentProject(projects[0]);
    };
    useEffect(() => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
        } else {
            Notification.requestPermission();
        }

        getProjects();
    }, []);

    return (
        <>
            <Layout>
                <Sider breakpoint="lg" collapsedWidth="0" theme="dark">
                    <div className="app-logo" />
                    <Menu mode={'vertical'} theme={'dark'}>
                        {/* <Menu defaultSelectedKeys={['0']} mode={'vertical'} theme={'dark'}> */}
                        {projects
                            .sort((a, b) => {
                                if (a.Name < b.Name) {
                                    return -1;
                                }
                                if (a.Name > b.Name) {
                                    return 1;
                                }
                                return 0;
                            })
                            .map((project, idx) => {
                                return <Menu.Item onClick={() => setCurrentProject(project)}>{project.Name}</Menu.Item>;
                                // return <Menu.Item key={idx}>{project.Name}</Menu.Item>;
                            })}
                    </Menu>
                </Sider>
                <Layout>
                    {/* <Header className="site-layout-sub-header-background" style={{ padding: 0 }} ></Header> */}
                    <Content>{currentProject && <Project project={currentProject} />}</Content>
                    <Footer style={{ textAlign: 'center' }}>©2021 CNFT sniper Created by jonteho</Footer>
                </Layout>
            </Layout>
        </>
    );
}

export default App;
