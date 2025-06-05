<script setup>
import {ref} from 'vue';
import {useForm} from '@inertiajs/vue3';
import ActionSection from '@/Components/ActionSection.vue';
import FormSection from '@/Components/FormSection.vue';
import SectionBorder from '@/Components/SectionBorder.vue';

const props = defineProps({
    tokens: Array,
    availablePermissions: Array,
    defaultPermissions: Array,
});

const createApiTokenForm = useForm({
    name: '',
    permissions: props.defaultPermissions,
});

const updateApiTokenForm = useForm({
    permissions: [],
});

const deleteApiTokenForm = useForm({});

const displayingToken = ref(false);
const managingPermissionsFor = ref(null);
const apiTokenBeingDeleted = ref(null);

const createApiToken = () => {
    createApiTokenForm.post(route('api-tokens.store'), {
        preserveScroll: true,
        onSuccess: () => {
            displayingToken.value = true;
            createApiTokenForm.reset();
        },
    });
};

const manageApiTokenPermissions = (token) => {
    updateApiTokenForm.permissions = token.abilities;
    managingPermissionsFor.value = token;
};

const updateApiToken = () => {
    updateApiTokenForm.put(route('api-tokens.update', managingPermissionsFor.value), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => (managingPermissionsFor.value = null),
    });
};

const confirmApiTokenDeletion = (token) => {
    apiTokenBeingDeleted.value = token;
};

const deleteApiToken = () => {
    deleteApiTokenForm.delete(route('api-tokens.destroy', apiTokenBeingDeleted.value), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => (apiTokenBeingDeleted.value = null),
    });
};
</script>

<template>
    <!-- Generate API Token -->
    <FormSection @submitted="createApiToken">
        <template #title>
            <h2>Create API Token</h2>
        </template>

        <template #description>
            API tokens allow third-party services to authenticate with our
            application on your behalf.
        </template>

        <template #form>
            <!-- Token Name -->
            <v-text-field id="name" v-model="createApiTokenForm.name"
                          type="text" autofocus label="Name"/>
            <template v-if="availablePermissions.length">
                <h3>Permissions</h3>
                <v-row no-gutters dense>
                    <v-col cols="6" md="4" lg="3"
                           class="pa-0"
                           v-for="permission in availablePermissions"
                           :key="permission">
                        <v-checkbox v-model="createApiTokenForm.permissions"
                                    hide-details
                                    :value="permission"
                                    :label="permission"/>
                    </v-col>
                </v-row>
            </template>
        </template>

        <template #actions>
            <v-alert type="info" closable
                     v-if="createApiTokenForm.recentlySuccessful"
                     density="compact" class="mb-2">
                Created
            </v-alert>
            <v-btn color="primary" variant="flat"
                   :disabled="createApiTokenForm.processing" type="submit">
                Create
            </v-btn>
        </template>
    </FormSection>

    <!-- Manage API Tokens -->
    <template v-if="tokens.length > 0">
        <SectionBorder/>
        <ActionSection class="mt-10">
            <template #title>
                <h2>Manage API Tokens</h2>
            </template>

            <template #description>
                <p>
                    You may delete any of your existing tokens if they are
                    no longer needed.
                </p>
            </template>

            <!-- API Token List -->
            <template #content class="my-6">
                <v-list>
                    <v-list-item v-for="token in tokens" :key="token.id" variant="tonal" class="mb-2 rounded">
                        <v-list-item-title>{{
                                token.name
                            }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            Last used {{ token.last_used_ago ?? 'Never' }}
                        </v-list-item-subtitle>
                        <v-list-item-action class="my-2">
                            <v-btn
                                v-if="availablePermissions.length"
                                size="small"
                                variant="flat"
                                @click="manageApiTokenPermissions(token)"
                            >
                                Permissions
                            </v-btn>
                            <v-btn
                                color="error"
                                size="small"
                                variant="flat"
                                class="ml-2"
                                @click="confirmApiTokenDeletion(token)"
                            >
                                Delete
                            </v-btn>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
            </template>
        </ActionSection>
    </template>


    <!-- Token Value Modal -->
    <v-dialog v-model="displayingToken" width="auto" persistent>
        <v-card max-width="" title="API Token">
            <v-card-text>
                <p>
                    Please copy your new API token. For your security, it
                    won't be shown again.
                </p>
            </v-card-text>
            <v-card-text v-if="$page.props.jetstream.flash.token">
                <code>{{ $page.props.jetstream.flash.token }}</code>
            </v-card-text>
            <v-card-actions>
                <v-btn color="secondary" @click="displayingToken = false">
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- API Token Permissions Modal -->
    <v-dialog v-model="managingPermissionsFor" persistent>
        <v-card title="API Token Permissions">
            <v-card-text>
                <v-row>
                    <v-col cols="6" md="4" lg="3"
                           class="pa-0"
                           v-for="permission in availablePermissions"
                           :key="permission">
                        <v-checkbox v-model="updateApiTokenForm.permissions"
                                    hide-details
                                    :value="permission"
                                    :label="permission"/>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="managingPermissionsFor = null">
                    Cancel
                </v-btn>
                <v-btn color="primary" @click="updateApiToken"
                       variant="flat"
                       :disabled="updateApiTokenForm.processing">
                    Save
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Delete Token Confirmation Modal -->
    <v-dialog v-model="apiTokenBeingDeleted" persistent width="512">
        <v-card title="Delete API Token">
            <v-card-text>
                Are you sure you would like to delete this API token?
            </v-card-text>
            <v-card-actions>
                <v-btn @click="apiTokenBeingDeleted = null">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="flat" :disabled="deleteApiTokenForm.processing"
                       @click="deleteApiToken">
                    Delete
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
