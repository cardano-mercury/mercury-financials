<script setup>
import {ref} from 'vue';
import {Head, Link, router} from '@inertiajs/vue3';
import ApplicationLogo from '@/media/mercury-logo-full.png';

import ApplicationMark from '@/Components/ApplicationMark.vue';
import Banner from '@/Components/Banner.vue';
import Dropdown from '@/Components/Dropdown.vue';
import DropdownLink from '@/Components/DropdownLink.vue';
import NavLink from '@/Components/NavLink.vue';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink.vue';

defineProps({
    title: String,
});

const showingNavigationDrawer = ref(true);
const rail = ref(false);

const switchToTeam = (team) => {
    router.put(route('current-team.update'), {
        team_id: team.id,
    }, {
        preserveState: false,
    });
};

const logout = () => {
    router.post(route('logout'));
};
</script>

<template>
    <v-app>
        <Head :title="title"/>
        <v-app-bar color="white" elevation="0">
            <template v-slot:prepend>
                <v-app-bar-nav-icon @click="rail = !rail"></v-app-bar-nav-icon>
            </template>
            <img :src="ApplicationLogo" height="48" width="151"
                 alt="Mercury: Invoice"/>
            <v-spacer/>
            <v-btn class="text-none" stacked>
                <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <v-btn class="text-none" stacked>
                <v-badge color="primary" dot>
                    <v-icon>mdi-bell</v-icon>
                </v-badge>
            </v-btn>
            <v-menu v-if="$page.props.jetstream.hasTeamFeatures">
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" append-icon="mdi-menu-down">
                        {{ $page.props.auth.user.current_team.name }}
                    </v-btn>
                </template>
                <v-list>
                    <v-list-subheader>Manage Business</v-list-subheader>
                    <v-list-item
                        :href="route('teams.show', $page.props.auth.user.current_team)">
                        Business Settings
                    </v-list-item>
                    <v-list-item v-if="$page.props.jetstream.canCreateTeam"
                                 :href="route('teams.create')">
                        Create New Business
                    </v-list-item>
                    <template v-if="$page.props.auth.user.all_teams.length > 1">
                        <v-divider/>
                        <v-list-subheader>Switch Business</v-list-subheader>
                        <template
                            v-for="team in $page.props.auth.user.all_teams"
                            :key="team.id">
                            <form @submit.prevent="switchToTeam(team)">
                                <v-list-item>
                                    <template v-slot:prepend
                                              v-if="team.id === $page.props.auth.user.current_team_id">
                                        <v-icon>mdi-check-circle-outline
                                        </v-icon>
                                    </template>
                                    {{ team.name }}
                                </v-list-item>
                            </form>
                        </template>
                    </template>
                </v-list>
            </v-menu>
            <v-menu rounded="0">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" rounded="0" stacked>
                        <v-avatar tile
                                  v-if="$page.props.jetstream.managesProfilePhotos"
                                  :image="$page.props.auth.user.profile_photo_url"/>
                        <v-icon v-else>mdi-account</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-subheader>Manage Account</v-list-subheader>
                    <!--                    <v-list-item :href="route('user.settings')"
                                                     prepend-icon="mdi-cog">Settings
                                        </v-list-item>-->
                    <v-list-item :href="route('profile.show')"
                                 prepend-icon="mdi-account">Profile
                    </v-list-item>
                    <v-list-item v-if="$page.props.jetstream.hasApiFeatures"
                                 :href="route('api-tokens.index')"
                                 prepend-icon="mdi-api">API Tokens
                    </v-list-item>
                    <!--                    <v-list-item :href="route('webhooks.index')"
                                                     prepend-icon="mdi-webhook">Webhooks
                                        </v-list-item>-->
                    <v-divider/>
                    <Link :href="route('logout')" method="post">
                        <v-list-item prepend-icon="mdi-power">Log Out
                        </v-list-item>
                    </Link>

                </v-list>
            </v-menu>
        </v-app-bar>
        <v-navigation-drawer :rail="rail" permanent
                             v-model="showingNavigationDrawer" elevation="0"
                             color="white">
            <v-list-item prepend-icon="mdi-wallet" title="Wallets"
                         :href="route('wallets.index')"
                         :active="route().current('wallets.*')"/>
            <v-list-item prepend-icon="mdi-account-group" title="Contacts"
                         :href="route('contacts.index')"
                         :active="route().current('contacts.*')"/>
            <!--            <v-list-item prepend-icon="mdi-home" title="Dashboard"
                                     :href="route('dashboard')"
                                     :active="route().current('dashboard')"/>
                        <v-list-item prepend-icon="mdi-account-group" title="Customers"
                                     :href="route('customers.index')"
                                     :active="route().current('customers.*')"/>
                        <v-list-item prepend-icon="mdi-clipboard" title="Products"
                                     :href="route('products.index')"
                                     :active="route().current('products.*')"/>
                        <v-list-item prepend-icon="mdi-hammer" title="Services"
                                     :href="route('services.index')"
                                     :active="route().current('services.*')"/>
                        <v-list-item prepend-icon="mdi-invoice-list" title="Invoices"
                                     :href="route('invoices.index')"
                                     :active="route().current('invoices.*')"/>
                        <v-list-item prepend-icon="mdi-list-box" title="Reports"/>-->

            <template v-slot:append v-if="!rail">
                <div class="pa-2">
                    <v-card>
                        <v-card-title>
                            <v-icon icon="mdi-face-agent"/>
                            Need Support?
                        </v-card-title>
                        <v-card-text>
                            Feel free to reach out using the button below.
                        </v-card-text>
                        <v-card-actions>
                            <v-btn color="black" variant="flat" block>Contact
                                Us
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </div>
            </template>
        </v-navigation-drawer>
        <v-main>
            <v-container fluid>
                <header v-if="$slots.header" class="mb-8">
                    <slot name="header"/>
                </header>
                <Banner/>
                <v-alert type="success" v-if="$page.props.flash?.success"
                         class="mb-4">
                    {{ $page.props.flash.success }}
                </v-alert>
                <v-alert type="info" v-if="$page.props.flash?.info"
                         class="mb-4">
                    {{ $page.props.flash.info }}
                </v-alert>
                <v-alert type="error" v-if="$page.props.flash?.error"
                         class="mb-4">
                    {{ $page.props.flash.error }}
                </v-alert>
                <main>
                    <slot/>
                </main>
            </v-container>
        </v-main>
        <v-footer app>
            <v-container class="text-center">
                Cardano Mercury: Financials v{{ $page.props.appVersion }}
            </v-container>
        </v-footer>
    </v-app>
</template>

<style>
.v-navigation-drawer--left {
    border-right-width: 0;
}

table {
    width: 100%;
}

.v-list a {
    text-decoration: inherit;
    color: inherit;
}
</style>
