interface EnvironmentArgs {
    id: string;
}

class Environment {
    id: string;
    constructor(self, args: EnvironmentArgs) {
        self.id = args.id;
    }

    create() {
        
    }
}