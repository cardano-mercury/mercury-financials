<script setup>
import {useForm} from '@inertiajs/vue3';
import FormSection from '@/Components/FormSection.vue';

const props = defineProps({
    team: Object,
    permissions: Object,
});

const form = useForm({
    name: props.team.name,
});

const updateTeamName = () => {
    form.put(route('teams.update', props.team), {
        errorBag: 'updateTeamName',
        preserveScroll: true,
    });
};
</script>

<template>
    <FormSection @submitted="updateTeamName">
        <template #title>
            Business Name
        </template>

        <template #description>
            The team's name and owner information.
        </template>

        <template #form>
            <v-row>
                <v-col cols="6">
                    <v-label>Business Owner</v-label>
                    <div class="d-flex align-center">
                        <v-avatar :image="team.owner.profile_photo_url"
                             :alt="team.owner.name" size="x-large"/>
                        <div class="ms-4">
                            <p>{{ team.owner.name }}</p>
                            <p>{{ team.owner.email }}</p>
                        </div>
                    </div>
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field label="Business Name" v-model="form.name"
                                  :disabled="!permissions.canUpdateTeam"/>
                    <v-alert type="error" class="mt-2" v-if="form.errors.name">
                        {{ form.errors.name }}
                    </v-alert>
                </v-col>
            </v-row>
        </template>

        <template v-if="permissions.canUpdateTeam" #actions>
            <v-chip color="success" v-show="form.recentlySuccessful" class="me-3">Saved</v-chip>
            <v-btn color="primary" :loading="form.processing" @click="updateTeamName">Save</v-btn>
        </template>
    </FormSection>
</template>
