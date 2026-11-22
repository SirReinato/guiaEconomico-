import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import ContainerGeral from '../pages/Outlet';

const Home = lazy(() => import('../pages/Home'));
const Cartoes = lazy(() => import('../pages/Cartoes'));
const Relatorios = lazy(() => import('../pages/Relatorios'));
const Saldos = lazy(() => import('../pages/Saldos'));
const Insights = lazy(() => import('../pages/Insights'));
const Metas = lazy(() => import('../pages/Metas'));
const Configuracoes = lazy(() => import('../pages/Configuracoes'));

const CarregandoRota = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 45vh;
    color: #94a3b8;
    font-size: 0.95rem;
    font-weight: 500;
`;

const AppRoutes = () => {
    return (
        <Suspense fallback={<CarregandoRota>Carregando página...</CarregandoRota>}>
            <Routes>
                <Route element={<ContainerGeral />}>
                    <Route element={<Home />} path='/' />
                    <Route element={<Cartoes />} path="/gastos-cartao" />
                    <Route element={<Relatorios />} path="/relatorios" />
                    <Route element={<Saldos />} path="/saldos" />
                    <Route element={<Saldos />} path="/comparativo" />
                    <Route element={<Insights />} path="/insights" />
                    <Route element={<Metas />} path="/metas" />
                    <Route element={<Configuracoes />} path="/configuracoes" />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
